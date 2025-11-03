import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import "dotenv/config";
import { storageService } from "./services/storage.service.js";

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

// Register JWT
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

// JWT Authentication decorator
fastify.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
});

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * 100, // 100MB per file
    files: 10, // Max 10 files per request
  },
});

// Register Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: "Cubby Server API",
      description: "API documentation for Cubby Server",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      { name: "auth", description: "Authentication endpoints" },
      { name: "users", description: "User management endpoints" },
      { name: "files", description: "File management endpoints" },
      { name: "health", description: "Health check endpoints" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

// Register Swagger UI
await fastify.register(swaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
});

// Register CORS
await fastify.register(cors, {
  origin: true, // Configure this based on your needs
});

// Health check route
fastify.get(
  "/health",
  {
    schema: {
      tags: ["health"],
      description: "Health check endpoint",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      },
    },
  },
  async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
);

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import fileRoutes from "./routes/files.js";

// Register routes
await fastify.register(authRoutes, { prefix: "/api/auth" });
await fastify.register(userRoutes, { prefix: "/api/users" });
await fastify.register(fileRoutes, { prefix: "/api/files" });

const start = async () => {
  try {
    // Initialize S3 storage
    await storageService.initialize();

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 Server ready at http://${host}:${port}`);
    console.log(`📚 API docs at http://${host}:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
