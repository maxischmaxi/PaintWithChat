import express from "express";
import { createServer } from "http";
import cors from "cors";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeSocket } from "./socket";
import authRoutes from "./routes/auth";
import sessionRoutes from "./routes/session";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/session", sessionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Start server
const start = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log("");
      console.log("🚀 StreamDraw API Server");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📡 HTTP Server: http://localhost:${config.port}`);
      console.log(`🔌 WebSocket Server: ws://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🗄️  Database: ${config.mongoUri}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});
