import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { channelId } = req.query;
  const { userId } = req.body;

  if (!channelId || !userId) {
    return res.status(400).json({ error: "Missing channelId or userId" });
  }

  try {
    const unreadCount = await db.notification.count({
      where: {
        userId: userId,
        read: false,
        channelId: channelId as string,
      },
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}