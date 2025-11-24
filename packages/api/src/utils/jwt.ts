import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface JWTPayload {
  userId: string;
  twitchId: string;
  username: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
