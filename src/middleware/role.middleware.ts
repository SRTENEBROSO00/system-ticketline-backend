import { Request, Response, NextFunction } from "express";

/**
 * Middleware to authorize access based on user roles.
 * Must be used AFTER authMiddleware (which sets req.user).
 *
 * @param roles - Allowed roles (e.g., 'admin', 'tecnico', 'cliente')
 *
 * @example
 * router.get('/users', authMiddleware, authorizeRoles('admin'), controller.getAll);
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};
