import { Request, Response } from "express";
import { Ticket } from "./../entity/Ticket";
import { AppDataSource } from "../data-source";
import { getIO } from "../socket.io";

export class TicketController {
  private ticketRepo = AppDataSource.getRepository(Ticket);

  /**
   * @swagger
   * /tickets/create:
   *   post:
   *     summary: Create a new ticket
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [clientName, title, phoneNumber, address, contracts, descriptionIssue, assignedTechnician]
   *             properties:
   *               clientName:
   *                 type: string
   *                 example: María García
   *               title:
   *                 type: string
   *                 example: Internet no funciona
   *               phoneNumber:
   *                 type: string
   *                 example: 809-555-0100
   *               address:
   *                 type: string
   *                 example: Calle Principal #123
   *               contracts:
   *                 type: string
   *                 example: CTR-2026-001
   *               descriptionIssue:
   *                 type: string
   *                 example: El cliente reporta que no tiene conexión a internet desde las 8am
   *               assignedTechnician:
   *                 type: string
   *                 example: Juan Técnico
   *               technicalDescription:
   *                 type: string
   *                 example: Router reiniciado, actualización de firmware
   *     responses:
   *       201:
   *         description: Ticket created successfully
   *       400:
   *         description: Missing required fields
   *       500:
   *         description: Server error
   */
  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const {
        clientName,
        title,
        phoneNumber,
        address,
        contracts,
        descriptionIssue,
        assignedTechnician,
        technicalDescription,
        solveDate,
      } = req.body;

      const requiredFields = {
        clientName,
        title,
        phoneNumber,
        address,
        contracts,
        descriptionIssue,
        assignedTechnician,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        res.status(400).json({
          message: "Required fields missing.",
          fields: missingFields,
        });
        return;
      }

      const newTicket = this.ticketRepo.create({
        clientName,
        title,
        phoneNumber,
        address,
        contracts,
        descriptionIssue,
        status: "Pendiente",
        assignedTechnician,
        technicalDescription: technicalDescription || "",
        solveDate: solveDate || null,
        softDelete: false,
      });

      await this.ticketRepo.save(newTicket);

      // Emit socket event
      getIO().emit("ticket:new", newTicket);

      res.status(201).json({ message: "✔ Ticket created.", ticket: newTicket });
    } catch (error) {
      res.status(500).json({ message: `Error creating ticket: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets:
   *   get:
   *     summary: Get all tickets with filters and pagination
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Pendiente, En Proceso, Resuelto, Cancelado]
   *         description: Filter by ticket status
   *       - in: query
   *         name: technician
   *         schema:
   *           type: string
   *         description: Filter by assigned technician name
   *       - in: query
   *         name: from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter tickets created from this date (YYYY-MM-DD)
   *       - in: query
   *         name: to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter tickets created up to this date (YYYY-MM-DD)
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in clientName, title, or descriptionIssue
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Items per page (max 100)
   *     responses:
   *       200:
   *         description: List of tickets with pagination
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Ticket'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized
   */
  async getAllTicket(req: Request, res: Response): Promise<any> {
    try {
      const {
        status,
        technician,
        from,
        to,
        search,
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNum - 1) * limitNum;

      const qb = this.ticketRepo
        .createQueryBuilder("ticket")
        .where("ticket.softDelete = :softDelete", { softDelete: false });

      // Filter by status
      if (status) {
        qb.andWhere("ticket.status = :status", { status });
      }

      // Filter by technician
      if (technician) {
        qb.andWhere("ticket.assignedTechnician LIKE :technician", {
          technician: `%${technician}%`,
        });
      }

      // Filter by date range
      if (from) {
        qb.andWhere("ticket.creationDate >= :from", {
          from: new Date(from as string),
        });
      }
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        qb.andWhere("ticket.creationDate <= :to", { to: toDate });
      }

      // Search in multiple fields
      if (search) {
        qb.andWhere(
          "(ticket.clientName LIKE :search OR ticket.title LIKE :search OR ticket.descriptionIssue LIKE :search)",
          { search: `%${search}%` }
        );
      }

      qb.orderBy("ticket.creationDate", "DESC");

      const [tickets, total] = await qb
        .skip(skip)
        .take(limitNum)
        .getManyAndCount();

      // Emit socket event
      getIO().emit("ticket:getall", tickets);

      return res.json({
        data: tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ message: `Error getting tickets: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets/{id}:
   *   get:
   *     summary: Get a ticket by ID
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Ticket data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ticket'
   *       404:
   *         description: Ticket not found
   */
  async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await this.ticketRepo.findOne({
        where: { id },
      });

      if (!ticket || ticket.softDelete) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      res.status(200).json(ticket);
    } catch (error) {
      res.status(500).json({ message: `Error getting ticket: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets/{id}:
   *   patch:
   *     summary: Update a ticket by ID
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               clientName:
   *                 type: string
   *               title:
   *                 type: string
   *               phoneNumber:
   *                 type: string
   *               address:
   *                 type: string
   *               contracts:
   *                 type: string
   *               descriptionIssue:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [Pendiente, En Proceso, Resuelto, Cancelado]
   *               assignedTechnician:
   *                 type: string
   *               technicalDescription:
   *                 type: string
   *               solveDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Ticket updated
   *       404:
   *         description: Ticket not found
   */
  async updateTicketById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        clientName,
        title,
        phoneNumber,
        address,
        contracts,
        descriptionIssue,
        status,
        assignedTechnician,
        technicalDescription,
        solveDate,
      } = req.body;

      const ticket = await this.ticketRepo.findOne({ where: { id } });

      if (!ticket || ticket.softDelete) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      // Update only provided fields
      if (clientName !== undefined) ticket.clientName = clientName;
      if (title !== undefined) ticket.title = title;
      if (phoneNumber !== undefined) ticket.phoneNumber = phoneNumber;
      if (address !== undefined) ticket.address = address;
      if (contracts !== undefined) ticket.contracts = contracts;
      if (descriptionIssue !== undefined) ticket.descriptionIssue = descriptionIssue;
      if (status !== undefined) ticket.status = status;
      if (assignedTechnician !== undefined) ticket.assignedTechnician = assignedTechnician;
      if (technicalDescription !== undefined) ticket.technicalDescription = technicalDescription;
      if (solveDate !== undefined) ticket.solveDate = solveDate;

      const savedTicket = await this.ticketRepo.save(ticket);

      // Emit socket event
      getIO().emit("ticket:update", savedTicket);

      res.json({
        message: "✔ Ticket updated successfully.",
        ticket: savedTicket,
      });
    } catch (error) {
      res.status(500).json({ message: `Error updating ticket: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets/{id}/status:
   *   patch:
   *     summary: Change ticket status only
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [Pendiente, En Proceso, Resuelto, Cancelado]
   *     responses:
   *       200:
   *         description: Status updated
   *       400:
   *         description: Invalid status
   *       404:
   *         description: Ticket not found
   */
  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["Pendiente", "En Proceso", "Resuelto", "Cancelado"];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
        return;
      }

      const ticket = await this.ticketRepo.findOne({ where: { id } });

      if (!ticket || ticket.softDelete) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      ticket.status = status;
      if (status === "Resuelto") {
        ticket.solveDate = new Date();
      }

      const savedTicket = await this.ticketRepo.save(ticket);
      getIO().emit("ticket:update", savedTicket);

      res.json({
        message: "✔ Status updated.",
        ticket: savedTicket,
      });
    } catch (error) {
      res.status(500).json({ message: `Error changing status: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets/{id}/assign:
   *   patch:
   *     summary: Assign a technician to a ticket
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [assignedTechnician]
   *             properties:
   *               assignedTechnician:
   *                 type: string
   *                 example: Carlos Técnico
   *     responses:
   *       200:
   *         description: Technician assigned
   *       400:
   *         description: Missing technician name
   *       404:
   *         description: Ticket not found
   */
  async assignTechnician(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTechnician } = req.body;

      if (!assignedTechnician) {
        res.status(400).json({ message: "Technician name is required." });
        return;
      }

      const ticket = await this.ticketRepo.findOne({ where: { id } });

      if (!ticket || ticket.softDelete) {
        res.status(404).json({ message: "Ticket not found." });
        return;
      }

      ticket.assignedTechnician = assignedTechnician;
      const savedTicket = await this.ticketRepo.save(ticket);

      getIO().emit("ticket:update", savedTicket);

      res.json({
        message: "✔ Technician assigned.",
        ticket: savedTicket,
      });
    } catch (error) {
      res.status(500).json({ message: `Error assigning technician: ${error}` });
    }
  }

  /**
   * @swagger
   * /tickets/{id}:
   *   delete:
   *     summary: Soft delete a ticket
   *     tags: [Tickets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Ticket deleted (soft)
   *       404:
   *         description: Ticket not found
   */
  async deleteTicket(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const ticket = await this.ticketRepo.findOneBy({ id });

      if (!ticket || ticket.softDelete) {
        return res.status(404).json({ message: "Ticket not found." });
      }

      ticket.softDelete = true;
      const result = await this.ticketRepo.save(ticket);

      // Emit socket event
      getIO().emit("ticket:delete", { id });

      res.status(200).json({
        message: "✔ Ticket deleted successfully.",
        ticket: result,
      });
    } catch (error) {
      res.status(500).json({ message: `Error deleting ticket: ${error}` });
    }
  }
}
