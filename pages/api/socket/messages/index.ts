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
export async function handlePostMessage(
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

    if (!serverId || !channelId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
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

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: server.members.find((m) => m.profileId === profile.id)!.id,
      },
      include: {
        member: { include: { profile: true } },
      },
    });

    const notifications = server.members
      .filter((m) => m.profileId !== profile.id) // Gửi thông báo cho các thành viên khác
      .map((m) => ({
        userId: m.profileId,
        message: `New message in ${channelId} from ${profile.name}`,
        channelId: channelId as string,
      }));

    // Tạo thông báo trong database
    await db.notification.createMany({ data: notifications });

    // Phát sự kiện `new_notification` cho tất cả user trong server
    notifications.forEach((notification) => {
      res?.socket?.server?.io?.emit("new_notification", notification);
    });

    return res.status(200).json(message);
  } catch (error) {
    console.error("[POST_MESSAGE_ERROR]", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
