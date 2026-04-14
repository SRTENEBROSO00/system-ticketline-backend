import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();
const authController = new AuthController();
const userController = new UserController();

// Public routes (no auth required)
router.post("/login", authController.login.bind(authController));
router.post("/register", userController.register.bind(userController));

// Protected routes (auth required)
router.get(
  "/users/profile",
  authMiddleware,
  userController.getProfile.bind(userController)
);

router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  userController.getAll.bind(userController)
);

router.get(
  "/users/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userController.getById.bind(userController)
);

router.put(
  "/users/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userController.update.bind(userController)
);

router.delete(
  "/users/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userController.softDelete.bind(userController)
);

export default router;