import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, channelId } = req.query;

  console.log('API called with query:', query, 'channelId:', channelId);

  if (!query || !channelId) {
    return res.status(400).json({ error: 'Missing query or channelId' });
  }

  try {
    const messages = await db.message.findMany({
      where: {
        channelId: String(channelId),
        content: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
    });

    console.log('Found messages:', messages);

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
