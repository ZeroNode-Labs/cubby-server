import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import "dotenv/config";

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
      { name: "users", description: "User related endpoints" },
      { name: "health", description: "Health check endpoints" },
    ],
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
import userRoutes from "./routes/users.js";

// Register routes
await fastify.register(userRoutes, { prefix: "/api/users" });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 Server ready at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
