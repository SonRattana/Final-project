import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HttpServer & {
      io?: SocketIOServer;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!res.socket.server.io) {
      const io = new SocketIOServer(res.socket.server, {
        path: "/api/socketio",
        addTrailingSlash: false,
      });
      res.socket.server.io = io;
    }

    const profile = await currentProfilePages(req);
    const { emoji, messageId } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ error: "Message ID missing" });
    }

    const message = await db.message.findFirst({
      where: { id: messageId as string },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingReaction = await db.reaction.findFirst({
      where: {
        messageId: messageId as string,
        emoji: emoji,
      },
    });

    let updatedReaction;

    if (existingReaction) {
      updatedReaction = await db.reaction.update({
        where: {
          id: existingReaction.id,
        },
        data: {
          count: existingReaction.count + 1,
        },
      });
    } else {
      updatedReaction = await db.reaction.create({
        data: {
          emoji: emoji,
          count: 1,
          messageId: messageId as string,
        },
      });
    }

    const updatedReactions = await db.reaction.findMany({
      where: {
        messageId: messageId as string,
      },
    });

    res.socket.server.io?.emit(`chat:${message.channelId}:messages:update`, {
      ...message,
      reactions: updatedReactions,
    });

    return res.status(200).json(updatedReactions);
  } catch (error) {
    console.log("[REACTION_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
