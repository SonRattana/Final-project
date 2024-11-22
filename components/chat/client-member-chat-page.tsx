"use client";

import { useRef, useCallback } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages,  ChatMessagesRef } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { MediaRoom } from "@/components/media-room";
import ClientChatHeader from "./client-chat-header";
import { channel } from "diagnostics_channel";

interface Message {
  id: string;
  content: string;
}

interface ClientMemberChatPageProps {
  serverId: string;
  conversationId: string;
  member: any; // Replace with the correct type for member
  otherMember: any; // Replace with the correct type for member
  messages: Message[];
  searchParams: {
    video?: boolean;
  };
}

const ClientMemberChatPage: React.FC<ClientMemberChatPageProps> = ({
  serverId,
  conversationId,
  member,
  otherMember,
  messages,
  searchParams,
}) => {
  const chatMessagesRef = useRef<ChatMessagesRef>(null);

  const handleScrollToMessage = useCallback((id: string) => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollToMessage(id);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ClientChatHeader
        imageUrl={otherMember.profile.imageUrl}
        name={otherMember.profile.name}
        serverId={serverId}
        type="conversation"
        messages={messages}
        scrollToMessage={handleScrollToMessage}
      />
      {searchParams.video && (
        <MediaRoom
          chatId={conversationId}
          video={true}
          audio={true}
        />
      )}
      {!searchParams.video && (
        <>
          <ChatMessages
            ref={chatMessagesRef}
            name={otherMember.profile.name}
            member={member}
            chatId={conversationId}
            type="conversation"
            apiUrl="/api/direct-messages"
            paramKey="conversationId"
            paramValue={conversationId}
            socketUrl="/api/socket/direct-messages"
            socketQuery={{
              conversationId: conversationId,
            }}
          />
          <ChatInput
            name={otherMember.profile.name}
            type="conversation"
            apiUrl="/api/socket/direct-messages"
            query={{
              serverId,
              conversationId: conversationId,
              channelId: "default-channel-id",
            }}
          />
        </>
      )}
    </div>
  );
};

export default ClientMemberChatPage;
