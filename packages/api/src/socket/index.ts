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
} from "@paintwithchat/shared";
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

// Store drawing save timers per session (for 1-second debouncing)
const drawingSaveTimers = new Map<string, NodeJS.Timeout>();

// Store all strokes per session in memory for quick retrieval
const sessionStrokes = new Map<string, DrawingStroke[]>();

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

        // Load existing drawings for this session
        let strokes: DrawingStroke[] = [];

        // Check memory cache first
        if (sessionStrokes.has(sessionId)) {
          strokes = sessionStrokes.get(sessionId)!;
        } else {
          // Load from database
          const drawing = await Drawing.findOne({ sessionId });
          if (drawing && drawing.strokes.length > 0) {
            strokes = drawing.strokes;
            sessionStrokes.set(sessionId, strokes);
          }
        }

        // Send current session state
        io.to(sessionId).emit("session:updated", {
          session: {
            id: session._id.toString(),
            currentDrawerId: session.currentDrawerId,
            activeUsers: session.activeUsers,
            active: session.active,
          },
        });

        // Send existing drawings to the joining client
        if (strokes.length > 0) {
          socket.emit("drawing:load", { strokes });
        }

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

        // Load existing drawings for this session
        let strokes: DrawingStroke[] = [];

        // Check memory cache first
        if (sessionStrokes.has(sessionId)) {
          strokes = sessionStrokes.get(sessionId)!;
        } else {
          // Load from database
          const drawing = await Drawing.findOne({ sessionId });
          if (drawing && drawing.strokes.length > 0) {
            strokes = drawing.strokes;
            sessionStrokes.set(sessionId, strokes);
          }
        }

        // Send current session state to viewer
        io.to(sessionId).emit("session:updated", {
          session: {
            id: session._id.toString(),
            currentDrawerId: session.currentDrawerId,
            activeUsers: session.activeUsers,
            active: session.active,
          },
        });

        // Send existing drawings to the joining client
        if (strokes.length > 0) {
          socket.emit("drawing:load", { strokes });
        }

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

    // Handle drawing start (no authorization - free drawing)
    socket.on("drawing:start", async ({ point, color, size }) => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      // Store stroke in memory
      const strokeId = `${socket.id}-${Date.now()}`;
      activeStrokes.set(strokeId, {
        points: [point],
        color,
        size,
        userId: data.userId || "anonymous",
      });

      // Broadcast to all clients in session
      io.to(data.sessionId).emit("drawing:stroke-start", {
        userId: data.userId || "anonymous",
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

      // Add stroke to session memory cache
      if (!sessionStrokes.has(data.sessionId)) {
        sessionStrokes.set(data.sessionId, []);
      }
      sessionStrokes.get(data.sessionId)!.push(finalStroke);

      // Remove from active strokes
      activeStrokes.delete(strokeId);

      // Broadcast completion
      io.to(data.sessionId).emit("drawing:stroke-end", {
        userId: stroke.userId,
        stroke: finalStroke,
      });

      // Debounced save to database (1 second after last stroke)
      // Clear existing timer for this session
      if (drawingSaveTimers.has(data.sessionId)) {
        clearTimeout(drawingSaveTimers.get(data.sessionId)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const strokes = sessionStrokes.get(data.sessionId);
          if (!strokes || strokes.length === 0) return;

          // Save all strokes to database
          let drawing = await Drawing.findOne({
            sessionId: data.sessionId,
          });

          if (!drawing) {
            drawing = await Drawing.create({
              sessionId: data.sessionId,
              userId: "session",
              username: "session",
              strokes: strokes,
            });
          } else {
            drawing.strokes = strokes;
            await drawing.save();
          }

          console.log(
            `💾 Saved ${strokes.length} strokes for session ${data.sessionId}`,
          );

          // Clean up timer
          drawingSaveTimers.delete(data.sessionId);
        } catch (error) {
          console.error("Save strokes error:", error);
        }
      }, 1000); // 1 second debounce

      drawingSaveTimers.set(data.sessionId, timer);
    });

    // Handle canvas clear (no authorization - free drawing)
    socket.on("canvas:clear", async () => {
      const data = socket.data as SocketData;
      if (!data || !data.sessionId) return;

      // Clear session strokes from memory
      sessionStrokes.set(data.sessionId, []);

      // Clear from database
      await Drawing.deleteMany({
        sessionId: data.sessionId,
      });

      // Clear any pending save timer
      if (drawingSaveTimers.has(data.sessionId)) {
        clearTimeout(drawingSaveTimers.get(data.sessionId)!);
        drawingSaveTimers.delete(data.sessionId);
      }

      console.log(`🗑️  Cleared canvas for session ${data.sessionId}`);

      // Broadcast to all clients
      io.to(data.sessionId).emit("canvas:cleared");
    });

    // Handle undo (no authorization - free drawing)
    socket.on("drawing:undo", async () => {
      const data = socket.data as SocketData;
      console.log("📥 Received undo event", {
        hasData: !!data,
        sessionId: data?.sessionId,
        socketId: socket.id,
      });

      if (!data || !data.sessionId) {
        console.log("❌ No socket data or sessionId for undo");
        return;
      }

      // Remove last stroke from session memory
      const strokes = sessionStrokes.get(data.sessionId);
      console.log(
        `🎨 Session ${data.sessionId} has ${strokes?.length || 0} strokes`,
      );

      if (strokes && strokes.length > 0) {
        const removedStroke = strokes.pop();
        sessionStrokes.set(data.sessionId, strokes);

        // Clear any pending save timer and trigger immediate save
        if (drawingSaveTimers.has(data.sessionId)) {
          clearTimeout(drawingSaveTimers.get(data.sessionId)!);
          drawingSaveTimers.delete(data.sessionId);
        }

        // Save updated strokes to database immediately
        try {
          let drawing = await Drawing.findOne({
            sessionId: data.sessionId,
          });

          if (drawing) {
            drawing.strokes = strokes;
            await drawing.save();
          }

          console.log(
            `↩️  Undone stroke for session ${data.sessionId}, ${strokes.length} strokes remaining`,
          );
        } catch (error) {
          console.error("Save undo error:", error);
        }

        // Broadcast to all clients
        console.log(
          `📢 Broadcasting undone event to session ${data.sessionId}`,
        );
        io.to(data.sessionId).emit("drawing:undone", {
          strokeId: removedStroke?.id || "",
        });
      } else {
        console.log("⚠️  No strokes to undo");
      }
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
