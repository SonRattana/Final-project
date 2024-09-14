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

   
      if (!res.socket.server.io) {
        const io = new SocketIOServer(res.socket.server, {
          path: "/api/socket/io",
        });
        res.socket.server.io = io;
      }

      
      await db.$transaction(async (prisma) => {
        const existingReaction = await prisma.reaction.findFirst({
          where: {
            messageId,
            emoji,
            profileId: profile.id,
          },
        });

        if (existingReaction) {
         
          await prisma.reaction.update({
            where: {
              id: existingReaction.id,
            },
            data: {
              count: existingReaction.count + 1,
            },
          });
        } else {
         
          await prisma.reaction.create({
            data: {
              messageId,
              emoji,
              count: 1,
              profileId: profile.id,
            },
          });
        }

        await prisma.reaction.groupBy({
          by: ['emoji'],
          where: { messageId },
          _sum: {
            count: true,
          },
        });
      });

     
      const updatedReactions = await db.reaction.findMany({
        where: { messageId },
        include: { profile: true },  
      });

      
     

      return res.status(200).json(updatedReactions);
    } catch (error) {
      console.error("[REACTION_POST] Error: ", error);
      return res.status(500).json({ error: "Failed to add reaction" });
    }
  }

  
  else if (req.method === "DELETE") {
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
      return res.status(400).json({ error: "Missing messageId or emoji" });
    }

    try {
      const profile = await currentProfilePages(req); 
      if (!profile) {
        return res.status(401).json({ error: "Unauthorized" });
      }

     
      if (!res.socket.server.io) {
        const io = new SocketIOServer(res.socket.server, {
          path: "/api/socket/io",
        });
        res.socket.server.io = io;
      }

      
      await db.$transaction(async (prisma) => {
        const existingReaction = await prisma.reaction.findFirst({
          where: {
            messageId,
            emoji,
            profileId: profile.id,
          },
          include: {
            profile: true,  
          },
        });

        if (!existingReaction) {
          return res.status(404).json({ error: "Reaction not found" });
        }

        
        if (existingReaction.profile.id !== profile.id) {
          return res.status(403).json({ error: "Forbidden" });
        }

        if (existingReaction.count > 1) {
          
          await prisma.reaction.update({
            where: {
              id: existingReaction.id,
            },
            data: {
              count: existingReaction.count - 1,
            },
          });
        } else {
          
          await prisma.reaction.delete({
            where: {
              id: existingReaction.id,
            },
          });
        }

        
        await prisma.reaction.groupBy({
          by: ['emoji'],
          where: { messageId },
          _sum: {
            count: true,
          },
        });
      });

      
      const updatedReactions = await db.reaction.findMany({
        where: { messageId },
        include: { profile: true },  
      });

     
     

      return res.status(200).json(updatedReactions);
    } catch (error) {
      console.error("[REACTION_DELETE] Error: ", error);
      return res.status(500).json({ error: "Failed to remove reaction" });
    }
  }

  
  else if (req.method === "GET") {
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
  }

  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
