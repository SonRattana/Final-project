// pages/api/notifications/index.ts
import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types"; 
import { db } from "@/lib/db"; 

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  const { userId, message, channelId } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!userId || !message || !channelId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create the notification in the database
    const notification = await db.notification.create({
      data: {
        userId,
        message,
        channelId,
        read: false,
      },
    });

    // Check if `res.socket.server.io` exists
    if (res.socket && res.socket.server && res.socket.server.io) {
      const io = res.socket.server.io; // Access the initialized io instance
      io.to(userId).emit("new_notification", notification);
    } else {
      console.error("Socket.io is not initialized on the server.");
      return res.status(500).json({ error: "Socket.io not initialized" });
    }

    return res.status(200).json({ notification });
  } catch (error) {
    console.error("Failed to send notification", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
