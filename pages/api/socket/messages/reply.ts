import { NextApiRequest, NextApiResponse } from 'next';

type Reaction = {
  emoji: string;
  count: number;
};

type MemberProfile = {
  id: string;
  profile: {
    name: string;
    imageUrl: string;
  };
};

type MessageWithReplies = {
  id: string;
  content: string;
  member: MemberProfile;
  replies: MessageWithReplies[];
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
};

// In-memory store for messages (for simplicity)
let messages: MessageWithReplies[] = [
  {
    id: '1',
    content: 'Hello World',
    member: { id: 'user1', profile: { name: 'User One', imageUrl: '' } },
    replies: [],
    reactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { messageId, content } = req.body;

    // Find the parent message
    const parentMessage = messages.find((msg) => msg.id === messageId);
    if (parentMessage) {
      const reply: MessageWithReplies = {
        id: String(new Date().getTime()), // Simple unique ID generation
        content,
        member: {
          id: 'user2', // This would typically be fetched from the request context or user session
          profile: { name: 'User Two', imageUrl: '' }
        },
        replies: [],
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add the reply to the parent message
      parentMessage.replies.push(reply);
      parentMessage.updatedAt = new Date();

      res.status(200).json(reply);
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
