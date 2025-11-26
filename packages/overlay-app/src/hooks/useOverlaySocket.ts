import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@paintwithchat/shared";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

export const useOverlaySocket = (sessionId: string | null) => {
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
