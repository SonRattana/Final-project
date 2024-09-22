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

      // Cập nhật hoặc thêm phản ứng
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
            where: { id: existingReaction.id },
            data: { count: existingReaction.count + 1 },
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
      });

      const updatedReactions = await db.reaction.findMany({
        where: { messageId },
        include: { profile: true },
      });

      // Phát sự kiện cập nhật phản ứng qua WebSocket ngay lập tức
      if (res.socket.server.io) {
        res.socket.server.io.emit("reaction_update", { messageId, reactions: updatedReactions });
      }

      return res.status(200).json(updatedReactions);
    } catch (error) {
      console.error("[REACTION_POST] Error: ", error);
      return res.status(500).json({ error: "Failed to add reaction" });
    }
  }

  if (req.method === "DELETE") {
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

      // Xóa phản ứng hoặc giảm số lượng
      await db.$transaction(async (prisma) => {
        const existingReaction = await prisma.reaction.findFirst({
          where: {
            messageId,
            emoji,
            profileId: profile.id,
          },
        });

        if (!existingReaction) {
          return res.status(404).json({ error: "Reaction not found" });
        }

        if (existingReaction.count > 1) {
          await prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { count: existingReaction.count - 1 },
          });
        } else {
          await prisma.reaction.delete({
            where: { id: existingReaction.id },
          });
        }
      });

      const updatedReactions = await db.reaction.findMany({
        where: { messageId },
        include: { profile: true },
      });

      // Phát sự kiện cập nhật phản ứng qua WebSocket ngay lập tức
      if (res.socket.server.io) {
        res.socket.server.io.emit("reaction_update", { messageId, reactions: updatedReactions });
      }

      return res.status(200).json(updatedReactions);
    } catch (error) {
      console.error("[REACTION_DELETE] Error: ", error);
      return res.status(500).json({ error: "Failed to remove reaction" });
    }
  }
}
