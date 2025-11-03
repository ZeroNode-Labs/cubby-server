import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

// Schema definitions
const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    name: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get(
    "/",
    {
      schema: {
        tags: ["users"],
        description: "Get all users",
        response: {
          200: {
            type: "array",
            items: userSchema,
          },
        },
      },
    },
    async () => {
      const users = await prisma.user.findMany();
      return users;
    }
  );

  // Get user by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["users"],
        description: "Get a user by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: userSchema,
          404: errorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return user;
    }
  );

  // Create user
  fastify.post(
    "/",
    {
      schema: {
        tags: ["users"],
        description: "Create a new user",
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string" },
          },
        },
        response: {
          201: userSchema,
          400: errorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { email: string; name?: string } }>,
      reply: FastifyReply
    ) => {
      const { email, name } = request.body;

      try {
        const user = await prisma.user.create({
          data: {
            email,
            name,
          },
        });
        return reply.status(201).send(user);
      } catch (error) {
        return reply.status(400).send({ error: "Failed to create user" });
      }
    }
  );

  // Update user
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["users"],
        description: "Update a user",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string" },
          },
        },
        response: {
          200: userSchema,
          404: errorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { email?: string; name?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { email, name } = request.body;

      try {
        const user = await prisma.user.update({
          where: { id },
          data: {
            ...(email && { email }),
            ...(name && { name }),
          },
        });
        return user;
      } catch (error) {
        return reply.status(404).send({ error: "User not found" });
      }
    }
  );

  // Delete user
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["users"],
        description: "Delete a user",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          204: {
            type: "null",
            description: "No content",
          },
          404: errorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      try {
        await prisma.user.delete({
          where: { id },
        });
        return reply.status(204).send();
      } catch (error) {
        return reply.status(404).send({ error: "User not found" });
      }
    }
  );
}
