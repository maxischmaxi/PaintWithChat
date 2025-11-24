// User Types
export interface User {
  id: string;
  twitchId: string;
  username: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  socketId: string;
  joinedAt: Date;
}

// Session Types
export interface Session {
  id: string;
  streamerId: string;
  streamerName: string;
  active: boolean;
  currentDrawerId: string | null;
  activeUsers: UserSession[];
  createdAt: Date;
  endedAt?: Date;
}

// Drawing Types
export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  userId: string;
  timestamp: Date;
}

export interface Drawing {
  sessionId: string;
  userId: string;
  username: string;
  strokes: DrawingStroke[];
  createdAt: Date;
}

// Drawing Configuration
export const COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
] as const;

export type Color = (typeof COLORS)[number];

export const BRUSH_SIZES = [2, 5, 10, 15, 20, 30] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

// Canvas Configuration
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
