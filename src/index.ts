import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import user from "./routes/user.route";
import tickets from "./routes/ticket.route";
import { AppDataSource } from "./data-source";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.io";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Variables
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 login attempts per 15 min
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS config
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Ticketline API Docs",
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use(authLimiter); // Apply stricter rate limit to login/register
app.use(user);
app.use("/tickets/", tickets);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

// Initialize Socket.IO
initSocket(server);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log("✔ 📦 Database initialized...");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on => http://localhost:${PORT}`);
      console.log(`📚 API Docs available at => http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err: unknown) => {
    console.error(`❌ Database connection error: ${err}`);
    process.exit(1);
  });