import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io : Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST']
        },
    });
    
    io.on("connection", (socket) => {
        console.log("Client connected.", socket.id);
    });
    return io;
}

export const getIO = () => {
    if(!io) {
        throw new Error("Socket.io is not working.")
    }
    return io;
}