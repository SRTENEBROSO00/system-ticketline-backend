import {Router } from "express";
import {TicketController} from "../controllers/tickets.controller";
import { authMiddleware, testAuthMiddleware } from "../middleware/auth.middleware";

const router = Router()
const ticketsControllers = new TicketController();

router.get('/', testAuthMiddleware, ticketsControllers.getAllTicket.bind(ticketsControllers));
router.get('/:id', ticketsControllers.getTicketById.bind(ticketsControllers));
router.post('/create', ticketsControllers.createTicket.bind(ticketsControllers));
router.patch('/:id', ticketsControllers.updateTicketById.bind(ticketsControllers));
router.delete('/:id', ticketsControllers.deleteTicket.bind(ticketsControllers));

export default router 