// Controller
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";

/**
 * Helper to strip password from user object
 */
const excludePassword = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export class UserController {
  private userRepo = AppDataSource.getRepository(User);

  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, name, role]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@ticketline.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: password123
   *               name:
   *                 type: string
   *                 example: Juan Pérez
   *               role:
   *                 type: string
   *                 enum: [admin, tecnico, cliente]
   *                 example: tecnico
   *               phone:
   *                 type: string
   *                 example: "+1 809-555-0100"
   *     responses:
   *       200:
   *         description: User registered successfully
   *       400:
   *         description: Missing required fields
   *       409:
   *         description: User already exists
   *       500:
   *         description: Server error
   */
  async register(req: Request, res: Response): Promise<any> {
    try {
      const { email, password, name, role, phone } = req.body;
      if (!email || !password || !name || !role)
        return res.status(400).json({ message: "Fields required." });

      const existingUser = await this.userRepo.findOneBy({ email });
      if (existingUser)
        return res.status(409).json({ message: "User is already registered." });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = this.userRepo.create({
        email,
        password: hashedPassword,
        name,
        role,
        phone: phone || null,
      });
      await this.userRepo.save(newUser);
      res.status(201).json({ message: "✔ User registered successfully!" });
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [admin, tecnico, cliente]
   *         description: Filter users by role
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or email
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
   *         description: Items per page
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserResponse'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden — admin only
   */
  async getAll(req: Request, res: Response): Promise<any> {
    try {
      const { role, search, page = "1", limit = "20" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNum - 1) * limitNum;

      const qb = this.userRepo
        .createQueryBuilder("user")
        .where("user.softDelete = :softDelete", { softDelete: false });

      if (role) {
        qb.andWhere("user.role = :role", { role });
      }

      if (search) {
        qb.andWhere(
          "(user.name LIKE :search OR user.email LIKE :search)",
          { search: `%${search}%` }
        );
      }

      qb.orderBy("user.createdAt", "DESC");

      const [users, total] = await qb
        .skip(skip)
        .take(limitNum)
        .getManyAndCount();

      const safeUsers = users.map(excludePassword);

      return res.json({
        data: safeUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }

  /**
   * @swagger
   * /users/profile:
   *   get:
   *     summary: Get current user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user's profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async getProfile(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ message: "Authentication required." });

      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user || user.softDelete)
        return res.status(404).json({ message: "User not found." });

      return res.json(excludePassword(user));
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID (admin only)
   *     tags: [Users]
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
   *         description: User data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       404:
   *         description: User not found
   */
  async getById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const user = await this.userRepo.findOneBy({ id });

      if (!user || user.softDelete)
        return res.status(404).json({ message: "User not found." });

      return res.json(excludePassword(user));
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user by ID (admin only)
   *     tags: [Users]
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
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               role:
   *                 type: string
   *                 enum: [admin, tecnico, cliente]
   *               phone:
   *                 type: string
   *               password:
   *                 type: string
   *                 description: New password (will be hashed)
   *     responses:
   *       200:
   *         description: User updated
   *       404:
   *         description: User not found
   */
  async update(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { name, email, role, phone, password } = req.body;

      const user = await this.userRepo.findOneBy({ id });
      if (!user || user.softDelete)
        return res.status(404).json({ message: "User not found." });

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (phone !== undefined) user.phone = phone;
      if (password) user.password = await bcrypt.hash(password, 10);

      const saved = await this.userRepo.save(user);
      return res.json({
        message: "✔ User updated successfully.",
        user: excludePassword(saved),
      });
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Soft delete user by ID (admin only)
   *     tags: [Users]
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
   *         description: User deleted (soft)
   *       404:
   *         description: User not found
   */
  async softDelete(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const user = await this.userRepo.findOneBy({ id });

      if (!user || user.softDelete)
        return res.status(404).json({ message: "User not found." });

      user.softDelete = true;
      await this.userRepo.save(user);

      return res.json({ message: "✔ User deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }
}
