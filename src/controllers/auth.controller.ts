// Controller
import { Request, Response } from "express";
import { genToken } from "../config/jwt";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";

export class AuthController {
  private userRepo = AppDataSource.getRepository(User);

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Authenticate user and get JWT token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: admin@ticketline.com
   *               password:
   *                 type: string
   *                 example: password123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 userData:
   *                   $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: Invalid credentials
   *       500:
   *         description: Server error
   */
  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(401).json({ message: "Fields required." });

      const resUser = await this.userRepo.findOneBy({ email });

      // Verify user exists
      if (!resUser)
        return res.status(401).json({ message: "User not found." });

      // Verify password
      const isMatch = await bcrypt.compare(password, resUser.password);
      if (!isMatch)
        return res.status(401).json({ message: "Wrong password." });

      // Generate token with role included for authorization
      const token = genToken({
        email: resUser.email,
        id: resUser.id,
        role: resUser.role,
      });

      // Exclude password from response
      const { password: _, ...safeUser } = resUser;
      return res.json({ token, userData: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: `Server error: ${error}` });
    }
  }
}
