import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Point,
  DrawingStroke,
} from "@streamdraw/shared";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

interface DrawingHandlers {
  onStrokeStart: (
    userId: string,
    point: Point,
    color: string,
    size: number,
  ) => void;
  onStrokeMove: (userId: string, point: Point) => void;
  onStrokeEnd: (userId: string, stroke: DrawingStroke) => void;
  onCanvasClear: () => void;
}

export const useOverlaySocket = (
  sessionId: string | null,
  handlers: DrawingHandlers,
) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentDrawerName, setCurrentDrawerName] = useState<string>("");

  useEffect(() => {
    if (!sessionId) {
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
      // Join as viewer (no token needed)
      newSocket.emit("viewer:join", { sessionId });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      setConnected(false);
    });

    newSocket.on("session:updated", (data) => {
      // Find current drawer info
      const drawer = data.session.activeUsers.find(
        (u) => u.userId === data.session.currentDrawerId,
      );
      if (drawer) {
        setCurrentDrawerName(drawer.displayName);
      } else {
        setCurrentDrawerName("");
      }
    });

    newSocket.on("drawer:changed", (data) => {
      setCurrentDrawerName(data.username);
    });

    newSocket.on("drawing:stroke-start", (data) => {
      handlers.onStrokeStart(data.userId, data.point, data.color, data.size);
    });

    newSocket.on("drawing:stroke-move", (data) => {
      handlers.onStrokeMove(data.userId, data.point);
    });

    newSocket.on("drawing:stroke-end", (data) => {
      handlers.onStrokeEnd(data.userId, data.stroke);
    });

    newSocket.on("canvas:cleared", () => {
      handlers.onCanvasClear();
    });

    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  return {
    socket,
    connected,
    currentDrawerName,
  };
};
