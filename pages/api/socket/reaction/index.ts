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
      console.log("Socket.IO server initialized");
    }

    const profile = await currentProfilePages(req);
    const { emoji, messageId } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ error: "Message ID missing" });
    }

    console.log("Received reaction request:", { emoji, messageId });

    const message = await db.message.findFirst({
      where: { id: messageId as string },
    });

    console.log("Found message:", message);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingReaction = await db.reaction.findFirst({
      where: {
        messageId: messageId as string,
        emoji: emoji,
      },
    });

    console.log("Existing reaction:", existingReaction);

    let updatedReaction;

    if (existingReaction) {
      console.log("Updating existing reaction");
      updatedReaction = await db.reaction.update({
        where: {
          id: existingReaction.id,
        },
        data: {
          count: existingReaction.count + 1,
        },
      });
      console.log("Updated reaction:", updatedReaction);
    } else {
      console.log("Creating new reaction");
      updatedReaction = await db.reaction.create({
        data: {
          emoji: emoji,
          count: 1,
          messageId: messageId as string,
          
        },
      });
      console.log("Created reaction:", updatedReaction);
    }

    const updatedReactions = await db.reaction.findMany({
      where: {
        messageId: messageId as string,
      },
    });

    console.log("Emitting update event:", {
      channelId: message.channelId,
      messageData: {
        ...message,
        reactions: updatedReactions,
      },
    });

    res.socket.server.io?.emit(`chat:${message.channelId}:messages:update`, {
      ...message,
      reactions: updatedReactions,
    });

    
    res.socket.server.io?.to(message.channelId).emit('new_reaction', {
      messageId,
      reactions: updatedReactions
    });

    return res.status(200).json(updatedReactions);
  } catch (error) {
    console.error("[REACTION_POST] Error details: ", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return res.status(500).json({ message: "Internal Error", error: error instanceof Error ? error.message : String(error) });
  }
}