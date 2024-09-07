import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";  // Ensure this is your Prisma client path
import { currentProfile } from "@/lib/current-profile";  // Utility to fetch current user's profile

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    const { reactionId } = req.query;  // Extract the reactionId from the URL
    const profile = await currentProfile();

    // Check if the user is authenticated
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if reactionId is provided
    if (!reactionId) {
      return res.status(400).json({ error: "Missing reactionId" });
    }

    try {
      // Delete the reaction by reactionId
      await db.reaction.delete({
        where: {
          id: String(reactionId),  // Convert reactionId to a string, as Prisma expects it
        },
      });

      // Respond with success
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[DELETE_REACTION] Error: ", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // If the method is not DELETE, return a 405 Method Not Allowed
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
