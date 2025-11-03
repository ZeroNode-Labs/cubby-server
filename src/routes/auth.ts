import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/auth.service.js";

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string", nullable: true },
            quota: { type: "number" },
            usedSpace: { type: "number" },
          },
        },
      },
    },
  },
};

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      name: { type: "string" },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string", nullable: true },
            quota: { type: "number" },
            usedSpace: { type: "number" },
          },
        },
      },
    },
  },
};

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post(
    "/register",
    {
      schema: {
        tags: ["auth"],
        description: "Register a new user",
        ...registerSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: { email: string; password: string; name?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password, name } = request.body;

        const user = await authService.register(email, password, name);

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
        });

        return reply.status(201).send({
          token,
          user,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        description: "Login a user",
        ...loginSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: { email: string; password: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password } = request.body;

        const user = await authService.login(email, password);

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
        });

        return reply.status(200).send({
          token,
          user,
        });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    }
  );

  // Get current user
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["auth"],
        description: "Get current user profile",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string", nullable: true },
              quota: { type: "number" },
              usedSpace: { type: "number" },
              isActive: { type: "boolean" },
              emailVerified: { type: "boolean" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const user = await authService.getUserById(request.user.id);
        return reply.send(user);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );
}
