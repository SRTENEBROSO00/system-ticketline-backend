# 🎫 Ticketline API

API REST para gestión de tickets de soporte técnico, construida con **Express 5**, **TypeORM**, **TypeScript** y **Socket.IO** para actualizaciones en tiempo real.

## 📋 Características

- ✅ Autenticación JWT con roles (`admin`, `tecnico`, `cliente`)
- ✅ CRUD completo de Tickets y Usuarios
- ✅ Filtros avanzados (status, técnico, fecha, búsqueda)
- ✅ Paginación en listados
- ✅ Soft delete (eliminación lógica)
- ✅ Actualizaciones en tiempo real con Socket.IO
- ✅ Rate limiting para protección contra brute force
- ✅ Documentación interactiva con Swagger UI
- ✅ Middleware de autorización basado en roles

## 🛠 Tecnologías

| Componente | Tecnología |
|---|---|
| Framework | Express 5.1 |
| ORM | TypeORM 0.3.24 |
| Base de Datos | SQLite (dev) |
| Autenticación | JWT + bcryptjs |
| Tiempo Real | Socket.IO |
| Documentación | Swagger/OpenAPI 3.0 |
| Lenguaje | TypeScript 5.8 |

## 🚀 Instalación

### Requisitos previos

- Node.js 18+
- npm 9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd system-ticketline-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## ⚙️ Variables de Entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `DB_PATH` | Ruta de la base de datos SQLite | `./data/ticketline.db` |
| `JWT_SECRET` | Clave secreta para tokens JWT | (requerido en producción) |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `8h` |
| `FRONTEND_URL` | URL del frontend (para CORS) | `http://localhost:5173` |

## 📖 Documentación de la API

### Swagger UI

Una vez el servidor está corriendo, accede a la documentación interactiva en:

```
http://localhost:3000/api-docs
```

### Health Check

```
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2026-04-14T18:00:00.000Z",
  "uptime": 123.456
}
```

---

## 📡 Endpoints

### 🔐 Autenticación

| Método | Ruta | Descripción | Auth | Rol |
|---|---|---|---|---|
| `POST` | `/login` | Iniciar sesión | ❌ | — |
| `POST` | `/register` | Registrar usuario | ❌ | — |

#### POST `/login`

```json
// Request body
{
  "email": "admin@ticketline.com",
  "password": "password123"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userData": {
    "id": "uuid",
    "email": "admin@ticketline.com",
    "name": "Admin",
    "role": "admin",
    "phone": null,
    "createdAt": "2026-04-14T18:00:00.000Z"
  }
}
```

#### POST `/register`

```json
// Request body
{
  "email": "tecnico@ticketline.com",
  "password": "password123",
  "name": "Juan Técnico",
  "role": "tecnico",
  "phone": "809-555-0100"
}

// Response 201
{
  "message": "✔ User registered successfully!"
}
```

---

### 👥 Usuarios

| Método | Ruta | Descripción | Auth | Rol |
|---|---|---|---|---|
| `GET` | `/users/profile` | Obtener perfil propio | ✅ | cualquiera |
| `GET` | `/users` | Listar todos los usuarios | ✅ | admin |
| `GET` | `/users/:id` | Obtener usuario por ID | ✅ | admin |
| `PUT` | `/users/:id` | Actualizar usuario | ✅ | admin |
| `DELETE` | `/users/:id` | Eliminar usuario (soft) | ✅ | admin |

#### Filtros disponibles en `GET /users`

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `role` | string | Filtrar por rol | `?role=tecnico` |
| `search` | string | Buscar por nombre o email | `?search=juan` |
| `page` | number | Número de página | `?page=1` |
| `limit` | number | Elementos por página (max 100) | `?limit=10` |

**Ejemplo de respuesta paginada:**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "tecnico@ticketline.com",
      "name": "Juan Técnico",
      "role": "tecnico",
      "phone": "809-555-0100",
      "createdAt": "2026-04-14T18:00:00.000Z",
      "updatedAt": "2026-04-14T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 🎫 Tickets

| Método | Ruta | Descripción | Auth | Rol |
|---|---|---|---|---|
| `GET` | `/tickets/` | Listar tickets (con filtros) | ✅ | cualquiera |
| `GET` | `/tickets/:id` | Obtener ticket por ID | ✅ | cualquiera |
| `POST` | `/tickets/create` | Crear ticket | ✅ | cualquiera |
| `PATCH` | `/tickets/:id` | Actualizar ticket | ✅ | cualquiera |
| `PATCH` | `/tickets/:id/status` | Cambiar estado del ticket | ✅ | cualquiera |
| `PATCH` | `/tickets/:id/assign` | Asignar técnico | ✅ | admin |
| `DELETE` | `/tickets/:id` | Eliminar ticket (soft) | ✅ | admin, tecnico |

#### Filtros disponibles en `GET /tickets/`

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `status` | string | Filtrar por estado | `?status=Pendiente` |
| `technician` | string | Filtrar por técnico asignado | `?technician=Juan` |
| `from` | date | Tickets creados desde esta fecha | `?from=2026-01-01` |
| `to` | date | Tickets creados hasta esta fecha | `?to=2026-12-31` |
| `search` | string | Buscar en nombre, título o descripción | `?search=internet` |
| `page` | number | Número de página | `?page=1` |
| `limit` | number | Elementos por página (max 100) | `?limit=10` |

**Ejemplo combinando filtros:**

```
GET /tickets/?status=Pendiente&technician=Juan&page=1&limit=5
```

#### POST `/tickets/create`

```json
// Request body
{
  "clientName": "María García",
  "title": "Internet no funciona",
  "phoneNumber": "809-555-0100",
  "address": "Calle Principal #123",
  "contracts": "CTR-2026-001",
  "descriptionIssue": "Sin conexión desde las 8am",
  "assignedTechnician": "Juan Técnico",
  "technicalDescription": ""
}

// Response 201
{
  "message": "✔ Ticket created.",
  "ticket": { ... }
}
```

#### PATCH `/tickets/:id/status`

Estados válidos: `Pendiente`, `En Proceso`, `Resuelto`, `Cancelado`

```json
// Request body
{
  "status": "En Proceso"
}
```

> **Nota:** Si el status cambia a `Resuelto`, el campo `solveDate` se establece automáticamente.

---

## 🔌 Socket.IO — Eventos en Tiempo Real

Conéctate al servidor WebSocket en el mismo host/puerto.

| Evento | Dirección | Descripción | Payload |
|---|---|---|---|
| `ticket:new` | Server → Client | Nuevo ticket creado | `Ticket object` |
| `ticket:getall` | Server → Client | Se consultaron todos los tickets | `Ticket[]` |
| `ticket:update` | Server → Client | Ticket actualizado | `Ticket object` |
| `ticket:delete` | Server → Client | Ticket eliminado | `{ id: string }` |

### Ejemplo de conexión (Frontend)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", { 
  withCredentials: true 
});

socket.on("ticket:new", (ticket) => {
  console.log("New ticket:", ticket);
});

socket.on("ticket:update", (ticket) => {
  console.log("Updated:", ticket);
});

socket.on("ticket:delete", ({ id }) => {
  console.log("Deleted ticket:", id);
});
```

---

## 🔒 Autenticación

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene del endpoint `/login` y tiene una duración configurable (default: 8 horas).

### Roles disponibles

| Rol | Permisos |
|---|---|
| `admin` | Acceso total: gestionar usuarios, tickets, asignar técnicos |
| `tecnico` | Gestionar tickets asignados, eliminar tickets |
| `cliente` | Ver y crear tickets |

---

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── jwt.ts               # Generación y verificación de tokens JWT
│   └── swagger.ts            # Configuración de Swagger/OpenAPI
├── controllers/
│   ├── auth.controller.ts    # Login
│   ├── tickets.controller.ts # CRUD de tickets + filtros
│   └── user.controller.ts    # CRUD de usuarios
├── entity/
│   ├── Ticket.ts             # Entidad Ticket (TypeORM)
│   └── User.ts               # Entidad User (TypeORM)
├── middleware/
│   ├── auth.middleware.ts     # Middleware de autenticación JWT
│   └── role.middleware.ts     # Middleware de autorización por roles
├── routes/
│   ├── ticket.route.ts       # Rutas de tickets
│   └── user.route.ts         # Rutas de usuarios + auth
├── data-source.ts            # Configuración de TypeORM
├── index.ts                  # Entry point (Express + Socket.IO)
└── socket.io.ts              # Configuración Socket.IO
```

---

## 🧪 Scripts Disponibles

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `npm run dev` | Inicia con nodemon (auto-reload) |
| Producción | `npm start` | Inicia el servidor |

---

## 📄 Licencia

ISC
