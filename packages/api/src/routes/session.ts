import { Router, Response } from "express";
import { Session } from "../models";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  CreateSessionResponse,
  GetSessionResponse,
  SelectUserRequest,
  SelectUserResponse,
  NextUserResponse,
  EndSessionResponse,
} from "@paintwithchat/shared";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /session/start - Start a new session
router.post(
  "/start",
  async (
    req: AuthRequest,
    res: Response<CreateSessionResponse | { error: string; message: string }>,
  ) => {
    try {
      const userId = req.user!.userId;

      // Check if user already has an active session
      const existingSession = await Session.findOne({
        streamerId: userId,
        active: true,
      });

      if (existingSession) {
        res.status(400).json({
          error: "BadRequest",
          message: "You already have an active session",
        });
        return;
      }

      // Create new session
      const session = await Session.create({
        streamerId: userId,
        streamerName: req.user!.username,
        active: true,
        currentDrawerId: null,
        activeUsers: [],
      });

      res.json({
        session: {
          id: session._id.toString(),
          streamerId: session.streamerId,
          streamerName: session.streamerName,
          active: session.active,
          currentDrawerId: session.currentDrawerId,
          activeUsers: session.activeUsers,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("Start session error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Failed to start session",
        });
    }
  },
);

// GET /session/current - Get current active session
router.get(
  "/current",
  async (
    req: AuthRequest,
    res: Response<GetSessionResponse | { error: string; message: string }>,
  ) => {
    try {
      const userId = req.user!.userId;

      const session = await Session.findOne({
        streamerId: userId,
        active: true,
      });

      if (!session) {
        res.json({ session: null });
        return;
      }

      res.json({
        session: {
          id: session._id.toString(),
          streamerId: session.streamerId,
          streamerName: session.streamerName,
          active: session.active,
          currentDrawerId: session.currentDrawerId,
          activeUsers: session.activeUsers,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("Get session error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Failed to get session",
        });
    }
  },
);

// POST /session/next-user - Select next random user
router.post(
  "/next-user",
  async (
    req: AuthRequest,
    res: Response<NextUserResponse | { error: string; message: string }>,
  ) => {
    try {
      const userId = req.user!.userId;

      const session = await Session.findOne({
        streamerId: userId,
        active: true,
      });

      if (!session) {
        res
          .status(404)
          .json({ error: "NotFound", message: "No active session found" });
        return;
      }

      if (session.activeUsers.length === 0) {
        res
          .status(400)
          .json({ error: "BadRequest", message: "No users in session" });
        return;
      }

      // Select random user
      const randomIndex = Math.floor(
        Math.random() * session.activeUsers.length,
      );
      const selectedUser = session.activeUsers[randomIndex];

      session.currentDrawerId = selectedUser.userId;
      await session.save();

      res.json({
        session: {
          id: session._id.toString(),
          streamerId: session.streamerId,
          streamerName: session.streamerName,
          active: session.active,
          currentDrawerId: session.currentDrawerId,
          activeUsers: session.activeUsers,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("Next user error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Failed to select next user",
        });
    }
  },
);

// POST /session/select-user - Select specific user
router.post(
  "/select-user",
  async (
    req: AuthRequest,
    res: Response<SelectUserResponse | { error: string; message: string }>,
  ) => {
    try {
      const userId = req.user!.userId;
      const { userId: selectedUserId } = req.body as SelectUserRequest;

      if (!selectedUserId) {
        res
          .status(400)
          .json({ error: "BadRequest", message: "userId is required" });
        return;
      }

      const session = await Session.findOne({
        streamerId: userId,
        active: true,
      });

      if (!session) {
        res
          .status(404)
          .json({ error: "NotFound", message: "No active session found" });
        return;
      }

      // Check if user is in active users
      const userExists = session.activeUsers.some(
        (u) => u.userId === selectedUserId,
      );

      if (!userExists) {
        res
          .status(400)
          .json({ error: "BadRequest", message: "User not in session" });
        return;
      }

      session.currentDrawerId = selectedUserId;
      await session.save();

      res.json({
        session: {
          id: session._id.toString(),
          streamerId: session.streamerId,
          streamerName: session.streamerName,
          active: session.active,
          currentDrawerId: session.currentDrawerId,
          activeUsers: session.activeUsers,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("Select user error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Failed to select user",
        });
    }
  },
);

// POST /session/end - End current session
router.post(
  "/end",
  async (
    req: AuthRequest,
    res: Response<EndSessionResponse | { error: string; message: string }>,
  ) => {
    try {
      const userId = req.user!.userId;

      const session = await Session.findOne({
        streamerId: userId,
        active: true,
      });

      if (!session) {
        res
          .status(404)
          .json({ error: "NotFound", message: "No active session found" });
        return;
      }

      session.active = false;
      session.endedAt = new Date();
      await session.save();

      res.json({
        session: {
          id: session._id.toString(),
          streamerId: session.streamerId,
          streamerName: session.streamerName,
          active: session.active,
          currentDrawerId: session.currentDrawerId,
          activeUsers: session.activeUsers,
          createdAt: session.createdAt,
          endedAt: session.endedAt,
        },
      });
    } catch (error) {
      console.error("End session error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Failed to end session",
        });
    }
  },
);

export default router;
