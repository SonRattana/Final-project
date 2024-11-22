// pages/api/users/search.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db'; // Assuming you're using Prisma or another ORM

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, serverId } = req.query; // Include serverId in the query

  if (!q || !serverId) {
    return res.status(400).json({ error: 'Query and serverId are required' });
  }

  try {
    // Fetch only the users who are members of the current server
    const users = await db.profile.findMany({
      where: {
        name: {
          contains: q as string,
          mode: 'insensitive',
        },
        members: { // Check for membership in the current server
          some: {
            serverId: serverId as string, // Filter by the server
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json(users); // Return filtered users
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
