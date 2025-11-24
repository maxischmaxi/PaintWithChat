import { Session, User } from "./types";

// API Request/Response Types

// Auth
export interface LoginRequest {
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  user: User;
}

// Session
export interface CreateSessionRequest {
  streamerId: string;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface GetSessionResponse {
  session: Session | null;
}

export interface SelectUserRequest {
  userId: string;
}

export interface SelectUserResponse {
  session: Session;
}

export interface NextUserResponse {
  session: Session;
}

export interface EndSessionResponse {
  session: Session;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
}
