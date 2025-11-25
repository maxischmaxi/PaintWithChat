import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionUpdate,
  UserSession,
  Point,
  DrawingStroke,
} from "@paintwithchat/shared";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

interface DrawingHandlers {
  onStrokeStart?: (
    userId: string,
    point: Point,
    color: string,
    size: number,
  ) => void;
  onStrokeMove?: (userId: string, point: Point) => void;
  onStrokeEnd?: (userId: string, stroke: DrawingStroke) => void;
  onCanvasClear?: () => void;
}

export const useSocket = (
  sessionId: string | null,
  token: string | null,
  drawingHandlers?: DrawingHandlers,
) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionUpdate, setSessionUpdate] = useState<SessionUpdate | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Use ref to store handlers to avoid dependency issues
  const handlersRef = useRef<DrawingHandlers | undefined>(drawingHandlers);

  useEffect(() => {
    handlersRef.current = drawingHandlers;
  }, [drawingHandlers]);

  useEffect(() => {
    if (!sessionId || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket: SocketType = io(WS_URL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      setConnected(true);
      // Join as streamer (observer mode - doesn't appear in active users)
      newSocket.emit("streamer:join", { sessionId, token });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      setConnected(false);
    });

    newSocket.on("session:updated", (data) => {
      setSessionUpdate(data.session);
    });

    newSocket.on("user:joined", (data) => {
      console.log("User joined:", data.user.username);
    });

    newSocket.on("user:left", (data) => {
      console.log("User left:", data.userId);
    });

    newSocket.on("drawer:changed", (data) => {
      console.log("Drawer changed:", data.username);
    });

    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message);
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, token]);

  // Setup drawing event handlers separately
  useEffect(() => {
    if (!socket) return;

    const handleStrokeStart = (data: any) => {
      console.log("Stroke start:", data);
      if (handlersRef.current?.onStrokeStart) {
        handlersRef.current.onStrokeStart(
          data.userId,
          data.point,
          data.color,
          data.size,
        );
      }
    };

    const handleStrokeMove = (data: any) => {
      if (handlersRef.current?.onStrokeMove) {
        handlersRef.current.onStrokeMove(data.userId, data.point);
      }
    };

    const handleStrokeEnd = (data: any) => {
      console.log("Stroke end:", data);
      if (handlersRef.current?.onStrokeEnd) {
        handlersRef.current.onStrokeEnd(data.userId, data.stroke);
      }
    };

    const handleCanvasClear = () => {
      console.log("Canvas cleared");
      if (handlersRef.current?.onCanvasClear) {
        handlersRef.current.onCanvasClear();
      }
    };

    socket.on("drawing:stroke-start", handleStrokeStart);
    socket.on("drawing:stroke-move", handleStrokeMove);
    socket.on("drawing:stroke-end", handleStrokeEnd);
    socket.on("canvas:cleared", handleCanvasClear);

    return () => {
      socket.off("drawing:stroke-start", handleStrokeStart);
      socket.off("drawing:stroke-move", handleStrokeMove);
      socket.off("drawing:stroke-end", handleStrokeEnd);
      socket.off("canvas:cleared", handleCanvasClear);
    };
  }, [socket]);

  return { socket, connected, sessionUpdate, error };
};
