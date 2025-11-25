import { Router, Request, Response } from "express";
import { User } from "../models";
import { getTwitchAccessToken, getTwitchUser } from "../utils/twitch";
import { generateToken } from "../utils/jwt";
import { LoginRequest, LoginResponse, AuthResponse } from "@paintwithchat/shared";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /auth/twitch - Exchange Twitch code for JWT token
router.post(
  "/twitch",
  async (
    req: Request<{}, {}, LoginRequest>,
    res: Response<LoginResponse | { error: string; message: string }>,
  ) => {
    try {
      const { code } = req.body;

      if (!code) {
        res
          .status(400)
          .json({
            error: "BadRequest",
            message: "Authorization code is required",
          });
        return;
      }

      // Exchange code for access token
      const accessToken = await getTwitchAccessToken(code);

      // Get user info from Twitch
      const twitchUser = await getTwitchUser(accessToken);

      // Find or create user in database
      let user = await User.findOne({ twitchId: twitchUser.id });

      if (!user) {
        user = await User.create({
          twitchId: twitchUser.id,
          username: twitchUser.login,
          displayName: twitchUser.display_name,
          avatar: twitchUser.profile_image_url,
        });
      } else {
        // Update user info in case it changed
        user.username = twitchUser.login;
        user.displayName = twitchUser.display_name;
        user.avatar = twitchUser.profile_image_url;
        await user.save();
      }

      // Generate JWT token
      const token = generateToken({
        userId: user._id.toString(),
        twitchId: user.twitchId,
        username: user.username,
      });

      res.json({
        token,
        user: {
          id: user._id.toString(),
          twitchId: user.twitchId,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Auth error:", error);
      res
        .status(500)
        .json({
          error: "InternalServerError",
          message: "Authentication failed",
        });
    }
  },
);

// GET /auth/me - Get current user
router.get(
  "/me",
  authenticateToken,
  async (
    req: AuthRequest,
    res: Response<AuthResponse | { error: string; message: string }>,
  ) => {
    try {
      const user = await User.findById(req.user!.userId);

      if (!user) {
        res.status(404).json({ error: "NotFound", message: "User not found" });
        return;
      }

      res.json({
        user: {
          id: user._id.toString(),
          twitchId: user.twitchId,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res
        .status(500)
        .json({ error: "InternalServerError", message: "Failed to get user" });
    }
  },
);

export default router;
