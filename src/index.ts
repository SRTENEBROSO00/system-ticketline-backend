import express from 'express';
import user from './routes/user.route';
import tickets from './routes/ticket.route'
import { AppDataSource } from './data-source';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket.io';

// Variables
const app = express();
const PORT = 3000;
const server = http.createServer(app)

//Middleware
app.use(express.json());

//Cors config
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Front URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Para session/cookie
}))

// Rutas
app.use(user);
app.use('/tickets/', tickets);

// Inicializar socket
initSocket(server);

// Inicliaziamos la database
AppDataSource.initialize()
.then(() => {
    console.log("✔ 📦 Database initialized...")
    server.listen(PORT, () => {
        console.log(`🚀 Server runnin on => http://localhost:${PORT}`)
    })
})
.catch((err: unknown) => {
    console.log(`Connection error: ${err}`)
});