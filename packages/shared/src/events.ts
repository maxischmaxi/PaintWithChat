import { Point, DrawingStroke, UserSession } from "./types";

// WebSocket Event Types

// Client -> Server Events
export interface ClientToServerEvents {
  "viewer:join": (data: { sessionId: string }) => void;
  "streamer:join": (data: { sessionId: string; token: string }) => void;
  "user:join": (data: { sessionId: string; token: string }) => void;
  "user:leave": () => void;
  "drawing:start": (data: {
    point: Point;
    color: string;
    size: number;
  }) => void;
  "drawing:move": (data: { point: Point }) => void;
  "drawing:end": () => void;
  "canvas:clear": () => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  "session:updated": (data: { session: SessionUpdate }) => void;
  "user:joined": (data: { user: UserSession }) => void;
  "user:left": (data: { userId: string }) => void;
  "drawer:changed": (data: { drawerId: string; username: string }) => void;
  "drawing:stroke-start": (data: {
    userId: string;
    point: Point;
    color: string;
    size: number;
  }) => void;
  "drawing:stroke-move": (data: { userId: string; point: Point }) => void;
  "drawing:stroke-end": (data: {
    userId: string;
    stroke: DrawingStroke;
  }) => void;
  "canvas:cleared": () => void;
  error: (data: { message: string }) => void;
}

// Helper Types
export interface SessionUpdate {
  id: string;
  currentDrawerId: string | null;
  activeUsers: UserSession[];
  active: boolean;
}
