// pages/api/notifications/mark-as-read.ts
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, channelId } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!userId || !channelId) {
    return res.status(400).json({ error: "Missing userId or channelId" });
  }

  try {
    // Mark all unread notifications for this user and channel as read
    const updated = await db.notification.updateMany({
      where: {
        userId: userId,
        channelId: channelId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    if (updated.count > 0) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ message: "No unread notifications found." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
}
