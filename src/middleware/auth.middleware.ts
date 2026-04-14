import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Token not provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const userData = verifyToken(token);
    req.user = userData;
    next();
  } catch {
    return res.status(403).json({ message: "Token not valid." });
  }
};

export const testAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  req.user = {
    name: "Cristian",
    role: "Tecnico",
    email: "test@test.com",
    ticket: "12",
  };
  next();
};