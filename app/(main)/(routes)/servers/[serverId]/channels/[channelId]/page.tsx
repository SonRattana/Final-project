import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ChannelType } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import ClientChatPage from "@/components/chat/client-chat-page";
import { ChatInput } from "@/components/chat/chat-input";
import { MediaRoom } from "@/components/media-room";
import ChatPage from "@/components/chat/chat-page";

interface ChannelIdPageProps {
  params: {
    serverId: string;
    channelId: string;
  };
}

const ChannelIdPage = async ({ params }: ChannelIdPageProps) => {
  const profile = await currentProfile();

  // Redirect to sign-in if no profile
  if (!profile) {
    return redirectToSignIn();
  }

  // Fetch the channel and check if the user is a member
  const channel = await db.channel.findUnique({
    where: {
      id: params.channelId,
    },
  });

  const member = await db.member.findFirst({
    where: {
      serverId: params.serverId,
      profileId: profile.id,
    },
  });

  // If no channel or not a member, redirect to homepage
  if (!channel || !member) {
    return redirect("/");
  }

  // Fetch messages for the channel
  const messages = await db.message.findMany({
    where: {
      channelId: channel.id,
    },
    select: {
      id: true,
      content: true,
      member: {
        select: {
          profile: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      {/* Render Chat Page */}
      <ChatPage
        serverId={channel.serverId}
        name={channel.name}
        type="channel"
        imageUrl="/default-image.png"
        messages={messages}
        member={member}
        chatId={channel.id}
        apiUrl="/api/messages"
        socketUrl="/api/socket/messages"
        socketQuery={{
          channelId: channel.id,
          serverId: channel.serverId,
        }}
      />

      {/* Conditionally render chat input or media room based on channel type */}
      {channel.type === ChannelType.TEXT && (
        <ChatInput
          name={channel.name}
          type="channel"
          apiUrl="/api/socket/messages"
          query={{
            channelId: channel.id,
            serverId: channel.serverId,
          }}
        />
      )}
      {channel.type === ChannelType.AUDIO && (
        <MediaRoom 
          chatId={channel.id} 
          video={false} 
          audio={true} 
        />
      )}
      {channel.type === ChannelType.VIDEO && (
        <MediaRoom 
          chatId={channel.id} 
          video={true} 
          audio={true} 
        />
      )}
    </div>
  );
};

export default ChannelIdPage;
