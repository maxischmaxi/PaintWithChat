import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { Session, Drawing, User } from "../models";
import { verifyToken } from "../utils/jwt";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  DrawingStroke,
  Point,
  UserSession,
} from "@streamdraw/shared";
import { config } from "../config/env";

type SocketIOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type SocketIOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketData {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  sessionId: string;
}

// Store current drawing strokes temporarily
const activeStrokes = new Map<
  string,
  { points: Point[]; color: string; size: number; userId: string }
>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io: SocketIOServer = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: SocketIOSocket) => {
    console.log("🔌 Client connected:", socket.id);

    // Handle streamer joining their own session (authenticated, but not added to active users)
    socket.on("streamer:join", async ({ sessionId, token }) => {
      try {
        // Verify token
        const payload = verifyToken(token);

        // Find session
        const session = await Session.findById(sessionId);

        if (!session || !session.active) {
          socket.emit("error", { message: "Session not found or inactive" });
          return;
        }

        // Verify this user is the streamer
        if (session.streamerId !== payload.userId) {
          socket.emit("error", {
            message: "Not authorized - not session owner",
          });
          return;
        }

        // Get user details from database
        const user = await User.findById(payload.userId);
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Join socket room (but don't add to activeUsers)
        socket.join(sessionId);

        // Store socket data
        (socket.data as SocketData) = {
          userId: payload.userId,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          sessionId,
        };

        // Send current session state
        io.to(sessionId).emit("session:updated", {
          session: {
            id: session._id.toString(),
            currentDrawerId: session.currentDrawerId,
            activeUsers: session.activeUsers,
            active: session.active,
          },
        });

        console.log(
          `🎥 Streamer ${user.displayName} joined session ${sessionId} (observer mode)`,
        );
      } catch (error) {
        console.error("Streamer join error:", error);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    // Handle viewer joining a session (no authentication required)
    socket.on("viewer:join", async ({ sessionId }) => {
      try {
        // Find session
        const session = await Session.findById(sessionId);

        if (!session || !session.active) {
          socket.emit("error", { message: "Session not found or inactive" });
          return;
        }

        // Join socket room as anonymous viewer
        socket.join(sessionId);

        // Store minimal socket data
        (socket.data as Partial<SocketData>) = {
          sessionId,
        };

        // Send current session state to viewer
        io.to(sessionId).emit("session:updated", {
          session: {
            id: session._id.toString(),
            currentDrawerId: session.currentDrawerId,
            activeUsers: session.activeUsers,
            active: session.active,
          },
        });

        console.log(`👁 Anonymous viewer joined session ${sessionId}`);
      } catch (error) {
        console.error("Viewer join error:", error);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    // Handle user joining a session (authenticated)
    socket.on("user:join", async ({ sessionId, token }) => {
      try {
        // Verify token
        const payload = verifyToken(token);

        // Find session
        const session = await Session.findById(sessionId);

        if (!session || !session.active) {
          socket.emit("error", { message: "Session not found or inactive" });
          return;
        }

        // Get user details from database
        const user = await User.findById(payload.userId);
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Add user to session
        const userSession: UserSession = {
          userId: payload.userId,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          socketId: socket.id,
          joinedAt: new Date(),
        };

        // Remove user if already exists (reconnection)
        session.activeUsers = session.activeUsers.filter(
          (u) => u.userId !== payload.userId,
        );
        session.activeUsers.push(userSession);
        await session.save();

        // Join socket room
        socket.join(sessionId);

        // Store socket data
        (socket.data as SocketData) = {
          userId: payload.userId,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          sessionId,
        };

        // Notify all clients
        io.to(sessionId).emit("user:joined", { user: userSession });
        io.to(sessionId).emit("session:updated", {
          session: {
            id: session._id.toString(),
            currentDrawerId: session.currentDrawerId,
            activeUsers: session.activeUsers,
            active: session.active,
          },
        });

        console.log(`✅ User ${payload.username} joined session ${sessionId}`);
      } catch (error) {
        console.error("Join error:", error);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    // Handle user leaving
    socket.on("user:leave", async () => {
      await handleUserLeave(socket, io);
    });

    socket.on("disconnect", async () => {
      console.log("🔌 Client disconnected:", socket.id);
      await handleUserLeave(socket, io);
    });

    // Handle drawing start
    socket.on("drawing:start", async ({ point, color, size }) => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      const session = await Session.findById(data.sessionId);
      if (!session || session.currentDrawerId !== data.userId) {
        socket.emit("error", { message: "Not authorized to draw" });
        return;
      }

      // Store stroke in memory
      const strokeId = `${socket.id}-${Date.now()}`;
      activeStrokes.set(strokeId, {
        points: [point],
        color,
        size,
        userId: data.userId,
      });

      // Broadcast to all clients in session
      io.to(data.sessionId).emit("drawing:stroke-start", {
        userId: data.userId,
        point,
        color,
        size,
      });
    });

    // Handle drawing move
    socket.on("drawing:move", async ({ point }) => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      // Find active stroke for this socket
      const strokeEntry = Array.from(activeStrokes.entries()).find(([id]) =>
        id.startsWith(socket.id),
      );

      if (!strokeEntry) return;

      const [strokeId, stroke] = strokeEntry;
      stroke.points.push(point);

      // Broadcast to all clients
      io.to(data.sessionId).emit("drawing:stroke-move", {
        userId: data.userId,
        point,
      });
    });

    // Handle drawing end
    socket.on("drawing:end", async () => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      // Find and finalize stroke
      const strokeEntry = Array.from(activeStrokes.entries()).find(([id]) =>
        id.startsWith(socket.id),
      );

      if (!strokeEntry) return;

      const [strokeId, stroke] = strokeEntry;

      const finalStroke: DrawingStroke = {
        id: strokeId,
        points: stroke.points,
        color: stroke.color,
        size: stroke.size,
        userId: stroke.userId,
        timestamp: new Date(),
      };

      // Save to database
      try {
        let drawing = await Drawing.findOne({
          sessionId: data.sessionId,
          userId: data.userId,
        });

        if (!drawing) {
          drawing = await Drawing.create({
            sessionId: data.sessionId,
            userId: data.userId,
            username: data.username,
            strokes: [finalStroke],
          });
        } else {
          drawing.strokes.push(finalStroke);
          await drawing.save();
        }

        // Remove from memory
        activeStrokes.delete(strokeId);

        // Broadcast completion
        io.to(data.sessionId).emit("drawing:stroke-end", {
          userId: data.userId,
          stroke: finalStroke,
        });
      } catch (error) {
        console.error("Save stroke error:", error);
      }
    });

    // Handle canvas clear
    socket.on("canvas:clear", async () => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      const session = await Session.findById(data.sessionId);
      if (!session || session.currentDrawerId !== data.userId) {
        socket.emit("error", { message: "Not authorized to clear canvas" });
        return;
      }

      // Clear all strokes for current drawer in this session
      await Drawing.deleteMany({
        sessionId: data.sessionId,
        userId: data.userId,
      });

      // Broadcast to all clients
      io.to(data.sessionId).emit("canvas:cleared");
    });
  });

  return io;
};

// Helper function to handle user leaving
async function handleUserLeave(
  socket: SocketIOSocket,
  io: SocketIOServer,
): Promise<void> {
  const data = socket.data as SocketData;
  if (!data || !data.sessionId) return;

  try {
    const session = await Session.findById(data.sessionId);
    if (!session) return;

    // Remove user from active users
    session.activeUsers = session.activeUsers.filter(
      (u) => u.socketId !== socket.id,
    );

    // If this was the current drawer, clear it
    if (session.currentDrawerId === data.userId) {
      session.currentDrawerId = null;
    }

    await session.save();

    // Notify all clients
    io.to(data.sessionId).emit("user:left", { userId: data.userId });
    io.to(data.sessionId).emit("session:updated", {
      session: {
        id: session._id.toString(),
        currentDrawerId: session.currentDrawerId,
        activeUsers: session.activeUsers,
        active: session.active,
      },
    });

    console.log(`❌ User ${data.username} left session ${data.sessionId}`);
  } catch (error) {
    console.error("Leave error:", error);
  }
}
