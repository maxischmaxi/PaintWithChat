import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "No token provided" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: "Forbidden", message: "Invalid token" });
  }
};
