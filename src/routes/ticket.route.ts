import { Router } from "express";
import { TicketController } from "../controllers/tickets.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();
const ticketController = new TicketController();

// All ticket routes require authentication
router.use(authMiddleware);

// CRUD routes
router.get("/", ticketController.getAllTicket.bind(ticketController));
router.get("/:id", ticketController.getTicketById.bind(ticketController));
router.post("/create", ticketController.createTicket.bind(ticketController));
router.patch("/:id", ticketController.updateTicketById.bind(ticketController));
router.delete(
  "/:id",
  authorizeRoles("admin", "tecnico"),
  ticketController.deleteTicket.bind(ticketController)
);

// Specialized endpoints
router.patch(
  "/:id/status",
  ticketController.changeStatus.bind(ticketController)
);
router.patch(
  "/:id/assign",
  authorizeRoles("admin"),
  ticketController.assignTechnician.bind(ticketController)
);

export default router;