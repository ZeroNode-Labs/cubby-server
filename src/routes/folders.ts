import { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import {
  parsePaginationParams,
  getPrismaOffsetLimit,
  buildPaginatedResponse,
  paginationQuerySchema,
  paginationResponseSchema,
} from "../utils/pagination.js";

export default async function folderRoutes(fastify: FastifyInstance) {
  // Create folder
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["folders"],
        description: "Create a new folder",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            parentId: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              path: { type: "string" },
              parentId: { type: "string", nullable: true },
              createdAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      const userId = request.user.id;
      const { name, parentId } = request.body;

      try {
        // Build path
        let path = `/${name}`;
        if (parentId) {
          const parent = await prisma.folder.findFirst({
            where: { id: parentId, userId },
          });

          if (!parent) {
            return reply.status(404).send({ error: "Parent folder not found" });
          }

          path = `${parent.path}/${name}`;
        }

        // Check if folder with same path already exists
        const existing = await prisma.folder.findUnique({
          where: {
            userId_path: {
              userId,
              path,
            },
          },
        });

        if (existing) {
          return reply
            .status(409)
            .send({ error: "Folder with this path already exists" });
        }

        // Create folder
        const folder = await prisma.folder.create({
          data: {
            name,
            path,
            parentId: parentId || null,
            userId,
          },
          select: {
            id: true,
            name: true,
            path: true,
            parentId: true,
            createdAt: true,
          },
        });

        return reply.status(201).send(folder);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to create folder" });
      }
    }
  );

  // List folders (with optional parent filter)
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["folders"],
        description: "List folders (paginated)",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            ...paginationQuerySchema.properties,
            parentId: {
              type: "string",
              description: "Filter by parent folder ID",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    path: { type: "string" },
                    parentId: { type: "string", nullable: true },
                    fileCount: { type: "number" },
                    createdAt: { type: "string" },
                  },
                },
              },
              pagination: paginationResponseSchema,
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      const userId = request.user.id;
      const { parentId, ...query } = request.query;
      const paginationOpts = parsePaginationParams(query);
      const { skip, take } = getPrismaOffsetLimit(paginationOpts);

      const where = {
        userId,
        isDeleted: false,
        parentId: parentId || null,
      };

      const [folders, total] = await Promise.all([
        prisma.folder.findMany({
          where,
          include: {
            _count: {
              select: { files: true },
            },
          },
          orderBy: {
            name: "asc",
          },
          skip,
          take,
        }),
        prisma.folder.count({ where }),
      ]);

      const foldersData = folders.map((f: any) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        parentId: f.parentId,
        fileCount: f._count.files,
        createdAt: f.createdAt,
      }));

      return reply.send(
        buildPaginatedResponse(foldersData, total, paginationOpts)
      );
    }
  );

  // Get folder contents (subfolders + files)
  fastify.get<{ Params: { id: string } }>(
    "/:id/contents",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["folders"],
        description: "Get folder contents (subfolders and files, paginated)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        querystring: paginationQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              folder: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  path: { type: "string" },
                },
              },
              subfolders: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        fileCount: { type: "number" },
                        createdAt: { type: "string" },
                      },
                    },
                  },
                  pagination: paginationResponseSchema,
                },
              },
              files: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        filename: { type: "string" },
                        size: { type: "number" },
                        mimeType: { type: "string" },
                        createdAt: { type: "string" },
                      },
                    },
                  },
                  pagination: paginationResponseSchema,
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { id } = request.params;
      const paginationOpts = parsePaginationParams((request as any).query);
      const { skip, take } = getPrismaOffsetLimit(paginationOpts);

      const folder = await prisma.folder.findFirst({
        where: {
          id,
          userId,
          isDeleted: false,
        },
      });

      if (!folder) {
        return reply.status(404).send({ error: "Folder not found" });
      }

      const subfoldersWhere = { parentId: id, isDeleted: false };
      const filesWhere = { folderId: id, isDeleted: false };

      const [subfolders, subfoldersTotal, files, filesTotal] =
        await Promise.all([
          prisma.folder.findMany({
            where: subfoldersWhere,
            include: {
              _count: {
                select: { files: true },
              },
            },
            orderBy: { name: "asc" },
            skip,
            take,
          }),
          prisma.folder.count({ where: subfoldersWhere }),
          prisma.file.findMany({
            where: filesWhere,
            select: {
              id: true,
              filename: true,
              size: true,
              mimeType: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.file.count({ where: filesWhere }),
        ]);

      const subfoldersData = subfolders.map((f: any) => ({
        id: f.id,
        name: f.name,
        fileCount: f._count.files,
        createdAt: f.createdAt,
      }));

      const filesData = files.map((f: any) => ({
        id: f.id,
        filename: f.filename,
        size: Number(f.size),
        mimeType: f.mimeType,
        createdAt: f.createdAt,
      }));

      return reply.send({
        folder: {
          id: folder.id,
          name: folder.name,
          path: folder.path,
        },
        subfolders: buildPaginatedResponse(
          subfoldersData,
          subfoldersTotal,
          paginationOpts
        ),
        files: buildPaginatedResponse(filesData, filesTotal, paginationOpts),
      });
    }
  );

  // Rename folder
  fastify.patch<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["folders"],
        description: "Rename a folder",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              path: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { id } = request.params;
      const { name } = (request as any).body;

      const folder = await prisma.folder.findFirst({
        where: { id, userId, isDeleted: false },
      });

      if (!folder) {
        return reply.status(404).send({ error: "Folder not found" });
      }

      // Calculate new path
      const pathParts = folder.path.split("/");
      pathParts[pathParts.length - 1] = name;
      const newPath = pathParts.join("/");

      // Check for conflicts
      const existing = await prisma.folder.findUnique({
        where: {
          userId_path: {
            userId,
            path: newPath,
          },
        },
      });

      if (existing && existing.id !== id) {
        return reply
          .status(409)
          .send({ error: "Folder with this name already exists" });
      }

      try {
        // Update folder and all descendant paths
        const updated = await prisma.$transaction(async (tx) => {
          // Update this folder
          const updatedFolder = await tx.folder.update({
            where: { id },
            data: { name, path: newPath },
          });

          // Update all descendants' paths
          const descendants = await tx.folder.findMany({
            where: {
              userId,
              path: {
                startsWith: folder.path + "/",
              },
            },
          });

          for (const desc of descendants) {
            const updatedDescPath = desc.path.replace(folder.path, newPath);
            await tx.folder.update({
              where: { id: desc.id },
              data: { path: updatedDescPath },
            });
          }

          return updatedFolder;
        });

        return reply.send({
          id: updated.id,
          name: updated.name,
          path: updated.path,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to rename folder" });
      }
    }
  );

  // Delete folder
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["folders"],
        description: "Delete a folder (must be empty)",
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
            description: "Folder deleted successfully",
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { id } = request.params;

      const folder = await prisma.folder.findFirst({
        where: { id, userId, isDeleted: false },
        include: {
          _count: {
            select: { files: true, children: true },
          },
        },
      });

      if (!folder) {
        return reply.status(404).send({ error: "Folder not found" });
      }

      // Check if folder is empty
      if (folder._count.files > 0 || folder._count.children > 0) {
        return reply
          .status(400)
          .send({ error: "Folder must be empty before deletion" });
      }

      await prisma.folder.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return reply.status(204).send();
    }
  );
}
