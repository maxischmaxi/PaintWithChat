import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { config } from "../config/env";

const router = Router();

/**
 * Basic health check endpoint
 * Returns 200 if server is running
 * Used by Railway, load balancers, and uptime monitors
 */
router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed health check endpoint
 * Includes database connection status and system metrics
 * Returns 503 if any critical service is unhealthy
 */
router.get("/detailed", async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const isDatabaseConnected = dbStatus === 1;

    // Calculate memory usage
    const memUsage = process.memoryUsage();
    const memoryPercentage = Math.round(
      (memUsage.heapUsed / memUsage.heapTotal) * 100,
    );

    // Build health status
    const healthStatus = {
      status: isDatabaseConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.version,
      environment: config.nodeEnv,
      database: {
        connected: isDatabaseConnected,
        state: ["disconnected", "connected", "connecting", "disconnecting"][
          dbStatus
        ],
      },
      memory: {
        usage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        },
        percentage: `${memoryPercentage}%`,
      },
    };

    // Return 503 if unhealthy, 200 if healthy
    const statusCode = healthStatus.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    // Return 503 on any error
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Readiness check endpoint
 * Returns 200 only when server is fully ready to accept requests
 * Checks: Database connection
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check if database is connected
    const dbStatus = mongoose.connection.readyState;
    const isReady = dbStatus === 1;

    if (isReady) {
      res.json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        reason: "Database not connected",
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Liveness check endpoint
 * Returns 200 if server process is alive
 * Does not check external dependencies
 */
router.get("/live", (req: Request, res: Response) => {
  res.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
