// pages/api/socket/io.ts
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types"; // Custom type for Socket.IO

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        console.log("Initializing Socket.IO");

        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: "/api/socket/io",
            pingInterval: 10000, // Default is 25000ms (25 seconds)
            pingTimeout: 5000,
        });

        io.on("connection", (socket) => {
            console.log("A user connected", socket.id);

            socket.on("join", (userId) => {
                console.log(`User ${userId} joined`);
                socket.join(userId);
            });

            socket.on("disconnect", () => {
                console.log("A user disconnected", socket.id);
            });
        });

        res.socket.server.io = io;
    } else {
        console.log("Socket.IO is already running");
    }

    res.end();
};

export default ioHandler;
