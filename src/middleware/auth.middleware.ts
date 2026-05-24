import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/envdot";
import type { NextFunction, Request, Response } from "express";

// JWT user type
interface DecodedUser extends JwtPayload {
  id: number;
  name: string;
  role: "contributor" | "maintainer";
}

// Custom Request
export interface AuthRequest extends Request {
  user?: DecodedUser;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      config.jwt_secret as string
    ) as DecodedUser;

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};