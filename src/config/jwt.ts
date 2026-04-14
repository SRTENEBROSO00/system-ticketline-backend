import Jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const SECRET_KEY = process.env.JWT_SECRET || "ticketline_dev_secret";
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "8h") as StringValue;

// Generate JWT token
export const genToken = (payload: object): string => {
  return Jwt.sign(payload, SECRET_KEY, {
    expiresIn: EXPIRES_IN,
  });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return Jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error("Invalid token");
  }
};