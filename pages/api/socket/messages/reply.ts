import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl, originalMessageId } = req.body;
    const { serverId, channelId } = req.query;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!serverId) {
      return res.status(400).json({ error: "Server ID missing" });
    }

    if (!channelId) {
      return res.status(400).json({ error: "Channel ID missing" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content missing" });
    }

    if (!originalMessageId) {
      return res.status(400).json({ error: "Original message ID missing" });
    }

    // Check if the original message exists
    const originalMessage = await db.message.findFirst({
      where: {
        id: originalMessageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!originalMessage) {
      return res.status(404).json({ message: "Original message not found" });
    }

    // Fetch the server and channel details
    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const member = server.members.find((member) => member.profileId === profile.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Create the reply message in the database
    const replyMessage = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
        replyToMessageId: originalMessageId as string, // This is the key for linking to the original message
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Emit the reply message via Socket.io
    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, replyMessage);

    // Send notifications to other members in the server
    const notifications = server.members
      .filter((m) => m.profileId !== profile.id)
      .map((m) => ({
        userId: m.profileId,
        message: `New reply in ${channel.name} from ${profile.name}: ${content}`,
        channelId: channelId as string,
      }));

    await db.notification.createMany({
      data: notifications,
    });

    // Emit notifications to all the relevant users
    notifications.forEach((notification) => {
      res?.socket?.server?.io?.to(notification.userId).emit("new_notification", notification);
    });

    return res.status(200).json(replyMessage);
  } catch (error) {
    console.log("[REPLY_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
