import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method === "POST") {
    return handlePostMessage(req, res);
  } else if (req.method === "GET") {
    return handleGetMessages(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

// Function to handle POST requests for sending a message
async function handlePostMessage(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl } = req.body;
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

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    const notifications = server.members
      .filter((m) => m.profileId !== profile.id)
      .map((m) => ({
        userId: m.profileId,
        message: `New message in ${channel.name} from ${profile.name}: ${content}`,
        channelId: channelId as string,
      }));

    await db.notification.createMany({
      data: notifications,
    });

    notifications.forEach((notification) => {
      res?.socket?.server?.io
        ?.to(notification.userId)
        .emit("new_notification", notification);
    });

    return res.status(200).json(message);
  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}

// Function to handle GET requests for fetching messages
async function handleGetMessages(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ error: "Channel ID is required" });
  }

  try {
    // Fetching messages from the channel, including replies
    const messages = await db.message.findMany({
      where: { channelId: channelId as string },
      include: {
        member: {
          include: { profile: true },
        },
        replies: {
          include: {
            member: {
              include: { profile: true },
            },
          },
        },
        replyTo: { // Make sure you're including the original message if it's a reply
          include: {
            member: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    

    // Returning the fetched messages to the frontend
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Error fetching messages" });
  }
}
