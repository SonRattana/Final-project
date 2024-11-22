import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  const { userId, message, channelId, taggedUsers } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!userId || !message || !channelId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Save the message into the database
    const savedMessage = await db.message.create({
      data: {
        content: message,
        channelId: channelId,
        memberId: userId,
        taggedUsers, // Save the list of tagged users
      },
    });

    // Send notification to tagged users (if using Socket.io)
    if (res.socket?.server?.io) {
      const io = res.socket.server.io;
      taggedUsers.forEach((taggedUser: string) => {
        io.to(taggedUser).emit("new_notification", {
          message: `You were tagged in a message: ${message}`,
        });
      });
    }

    return res.status(200).json({ message: savedMessage });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
