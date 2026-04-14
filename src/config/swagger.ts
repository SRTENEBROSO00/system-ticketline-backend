import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ticketline API",
      version: "1.0.0",
      description:
        "API REST para gestión de tickets de soporte técnico. Incluye autenticación JWT, roles de usuario, y operaciones CRUD completas para tickets y usuarios.",
      contact: {
        name: "Ticketline Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from /login",
        },
      },
      schemas: {
        UserResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["admin", "tecnico", "cliente"] },
            phone: { type: "string", nullable: true },
            softDelete: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Ticket: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            clientName: { type: "string" },
            title: { type: "string" },
            phoneNumber: { type: "string" },
            address: { type: "string" },
            contracts: { type: "string" },
            descriptionIssue: { type: "string" },
            status: {
              type: "string",
              enum: ["Pendiente", "En Proceso", "Resuelto", "Cancelado"],
            },
            assignedTechnician: { type: "string" },
            technicalDescription: { type: "string" },
            creationDate: { type: "string", format: "date-time" },
            solveDate: { type: "string", format: "date-time", nullable: true },
            updatedAt: { type: "string", format: "date-time" },
            softDelete: { type: "boolean" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 50 },
            totalPages: { type: "integer", example: 3 },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints (login, register)",
      },
      {
        name: "Users",
        description: "User management (admin only, except profile)",
      },
      {
        name: "Tickets",
        description:
          "Ticket management with filters, pagination, and real-time updates",
      },
    ],
  },
  apis: ["./src/controllers/*.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
