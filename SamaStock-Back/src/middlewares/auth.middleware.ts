import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Accès non autorisé",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      email: string;
      role: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalide ou expiré",
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Accès non autorisé",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès interdit : permissions insuffisantes",
      });
    }

    next();
  };
};