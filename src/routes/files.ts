import { FastifyInstance, FastifyReply } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { storageService } from "../services/storage.service.js";
import { prisma } from "../lib/prisma.js";
import mime from "mime-types";
import { nanoid } from "nanoid";
import {
  isAllowedMimeType,
  getAllowedTypesMessage,
} from "../config/mime-types.js";

export default async function fileRoutes(fastify: FastifyInstance) {
  // Upload file(s)
  fastify.post(
    "/upload",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["files"],
        description:
          "Upload one or more image files (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, HEIC, HEIF)",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          201: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    filename: { type: "string" },
                    size: { type: "number" },
                    mimeType: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.user.id;

        // Get user to check quota
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.status(404).send({ error: "User not found" });
        }

        const parts = request.parts();
        const uploadedFiles = [];

        for await (const part of parts) {
          if (part.type === "file") {
            const file = part as MultipartFile;

            // Check quota
            const fileSize = BigInt(file.file.bytesRead || 0);
            const totalSize = user.usedSpace + fileSize;

            if (totalSize > user.quota) {
              return reply.status(413).send({
                error: "Quota exceeded",
                quota: user.quota.toString(),
                used: user.usedSpace.toString(),
                available: (user.quota - user.usedSpace).toString(),
              });
            }

            // Get file buffer
            const buffer = await file.toBuffer();
            const actualSize = BigInt(buffer.length);

            // Determine MIME type
            const mimeType =
              file.mimetype ||
              mime.lookup(file.filename) ||
              "application/octet-stream";

            // Validate MIME type
            if (!isAllowedMimeType(mimeType)) {
              return reply.status(400).send({
                error: "File type not allowed",
                message: getAllowedTypesMessage(),
                receivedType: mimeType,
              });
            }

            // Generate S3 key
            const s3Key = storageService.generateKey(userId, file.filename);

            // Upload to S3
            await storageService.uploadFile(s3Key, buffer, {
              contentType: mimeType,
              size: buffer.length,
              userId,
              originalName: file.filename,
            });

            // Save to database
            const dbFile = await prisma.file.create({
              data: {
                id: nanoid(),
                filename: file.filename,
                originalName: file.filename,
                mimeType,
                size: actualSize,
                s3Key,
                s3Bucket: process.env.S3_BUCKET || "cubby-files",
                userId,
              },
            });

            // Update user's used space
            await prisma.user.update({
              where: { id: userId },
              data: {
                usedSpace: {
                  increment: actualSize,
                },
              },
            });

            uploadedFiles.push({
              id: dbFile.id,
              filename: dbFile.filename,
              size: Number(dbFile.size),
              mimeType: dbFile.mimeType,
            });
          }
        }

        return reply.status(201).send({ files: uploadedFiles });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to upload files" });
      }
    }
  );

  // List user's files
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["files"],
        description: "List all files for the current user",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    filename: { type: "string" },
                    mimeType: { type: "string" },
                    size: { type: "number" },
                    createdAt: { type: "string" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      const userId = request.user.id;

      const files = await prisma.file.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({
        files: files.map((f: any) => ({
          ...f,
          size: Number(f.size),
        })),
        total: files.length,
      });
    }
  );

  // Download file
  fastify.get<{ Params: { id: string } }>(
    "/:id/download",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["files"],
        description: "Download a file",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { id } = request.params;

      // Get file from database
      const file = await prisma.file.findFirst({
        where: {
          id,
          userId,
          isDeleted: false,
        },
      });

      if (!file) {
        return reply.status(404).send({ error: "File not found" });
      }

      try {
        // Get file from S3
        const stream = await storageService.downloadFile(file.s3Key);

        // Set headers
        reply.header("Content-Type", file.mimeType);
        reply.header(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(file.filename)}"`
        );
        reply.header("Content-Length", file.size.toString());

        return reply.send(stream);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to download file" });
      }
    }
  );

  // Delete file
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["files"],
        description: "Delete a file",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          204: {
            type: "null",
            description: "File deleted successfully",
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { id } = request.params;

      // Get file from database
      const file = await prisma.file.findFirst({
        where: {
          id,
          userId,
          isDeleted: false,
        },
      });

      if (!file) {
        return reply.status(404).send({ error: "File not found" });
      }

      try {
        // Delete from S3
        await storageService.deleteFile(file.s3Key);

        // Mark as deleted in database
        await prisma.file.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Update user's used space
        await prisma.user.update({
          where: { id: userId },
          data: {
            usedSpace: {
              decrement: file.size,
            },
          },
        });

        return reply.status(204).send();
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to delete file" });
      }
    }
  );
}
