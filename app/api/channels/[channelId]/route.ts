import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface Notification {
  userId: string;
  message: string;
  channelId: string;
  createdAt: Date;
  read: boolean;
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!params.channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            }
          }
        }
      },
      data: {
        channels: {
          delete: {
            id: params.channelId,
            name: {
              not: "general",
            }
          }
        }
      },
      include: {
        members: true, 
      }
    });

    
    const notifications: Notification[] = server.members.map((m) => ({
      userId: m.profileId,
      message: `Channel ${params.channelId} has been deleted by ${profile.name}`,
      channelId: params.channelId,
      createdAt: new Date(), 
      read: false, 
    }));

    await db.notification.createMany({
      data: notifications,
    });

    notifications.forEach((notification) => {
      sendNotification(notification.userId, notification.message);
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!params.channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            }
          }
        }
      },
      data: {
        channels: {
          update: {
            where: {
              id: params.channelId,
              NOT: {
                name: "general",
              },
            },
            data: {
              name,
              type,
            }
          }
        }
      },
      include: {
        members: true, 
      }
    });

    const notifications: Notification[] = server.members.map((m) => ({
      userId: m.profileId,
      message: `Channel ${params.channelId} has been updated by ${profile.name}`,
      channelId: params.channelId,
      createdAt: new Date(), 
      read: false, 
    }));

    await db.notification.createMany({
      data: notifications,
    });

    notifications.forEach((notification) => {
      sendNotification(notification.userId, notification.message);
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  const { channelId } = params;
  const { userId } = await req.json();

  if (!channelId || !userId) {
    return NextResponse.json({ error: "Missing channelId or userId" }, { status: 400 });
  }

  try {
    const unreadCount = await db.notification.count({
      where: {
        userId: userId,
        read: false,
        channelId: channelId,
      },
    });

    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


function sendNotification(userId: string, message: string, senderId?: string) {
  const io = (global as any).io;
  if (io && userId !== senderId) {
    // Chỉ gửi nếu userId khác senderId
    io.to(userId).emit("new_notification", { message });
  }
}