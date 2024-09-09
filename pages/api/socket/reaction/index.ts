import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";  
import { currentProfilePages } from "@/lib/current-profile-pages";  
import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HttpServer & {
      io?: SocketIOServer;
    };
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method === "POST") {
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
      return res.status(400).json({ error: "Missing messageId or emoji" });
    }

    try {
      const profile = await currentProfilePages(req); 
      if (!profile) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Initialize Socket.IO if not already running
      if (!res.socket.server.io) {
        const io = new SocketIOServer(res.socket.server, {
          path: "/api/socket/io",
        });
        res.socket.server.io = io;
      }

      // Use transaction to ensure atomicity when merging reactions
      await db.$transaction(async (prisma) => {
        const existingReaction = await prisma.reaction.findFirst({
          where: {
            messageId,
            emoji,
            profileId: profile.id,
          },
        });

        if (existingReaction) {
          // If reaction exists, increment the count for the same emoji
          await prisma.reaction.update({
            where: {
              id: existingReaction.id,
            },
            data: {
              count: existingReaction.count + 1,
            },
          });
        } else {
          // Create a new reaction if it doesn't exist
          await prisma.reaction.create({
            data: {
              messageId,
              emoji,
              count: 1,
              profileId: profile.id,
            },
          });
        }

        // Now merge all reactions for the same emoji (this will sum up counts)
        const mergedReactions = await prisma.reaction.groupBy({
          by: ['emoji'],
          where: { messageId },
          _sum: {
            count: true,
          },
        });

        // Optionally, you can handle merging user profiles related to each emoji
        // but for now, we are only merging the count.
      });

      // Fetch updated reactions with merged counts from the database
      const updatedReactions = await db.reaction.findMany({
        where: { messageId },
        include: { profile: true },  // Include profile information in the result
      });

      // Emit the "reaction_added" event with updated reactions
      res.socket.server.io.emit("reaction_added", {
        messageId,
        reactions: updatedReactions,
      });

      return res.status(200).json(updatedReactions);
    } catch (error) {
      console.error("[REACTION_POST] Error: ", error);
      return res.status(500).json({ error: "Failed to add reaction" });
    }
  } else if (req.method === "GET") {
    // Handle GET request to fetch members who reacted with a specific emoji
    const { messageId, emoji } = req.query;

    if (!messageId || !emoji) {
      return res.status(400).json({ error: "Missing messageId or emoji" });
    }

    try {
      const reactions = await db.reaction.findMany({
        where: {
          messageId: messageId as string,
          emoji: emoji as string,
        },
        include: {
          profile: true,
        },
      });

      const members = reactions.map((reaction) => ({
        id: reaction.profile.id,
        name: reaction.profile.name,
        imageUrl: reaction.profile.imageUrl,
      }));

      return res.status(200).json(members);
    } catch (error) {
      console.error("[REACTION_GET] Error: ", error);
      return res.status(500).json({ error: "Failed to fetch reaction members" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
