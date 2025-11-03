import Fastify from "fastify";
import cors from "@fastify/cors";
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

// Register CORS
await fastify.register(cors, {
  origin: true, // Configure this based on your needs
});

// Health check route
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

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
