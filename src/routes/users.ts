import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get("/", async () => {
    const users = await prisma.user.findMany();
    return users;
  });

  // Get user by ID
  fastify.get(
    "/:id",
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
