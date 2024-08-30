// components/chat/client-chat-page.tsx
"use client";

import { useRef, useCallback } from "react";
import {ChatHeader} from "./chat-header";
import { ChatMessages, ChatMessagesRef } from "@/components/chat/chat-messages";
import ClientChatHeader from "./client-chat-header";
interface Message {
  id: string;
  content: string;
}

interface ClientChatPageProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  messages: Message[];
  member: any; // Replace with the correct type for member
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const ClientChatPage: React.FC<ClientChatPageProps> = ({
  serverId,
  name,
  type,
  imageUrl,
  messages,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
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
        serverId={serverId}
        name={name}
        type={type}
        imageUrl={imageUrl}
        messages={messages}
        scrollToMessage={handleScrollToMessage}
      />
      <ChatMessages
        ref={chatMessagesRef}
        name={name}
        member={member}
        chatId={chatId}
        apiUrl={apiUrl}
        socketUrl={socketUrl}
        socketQuery={socketQuery}
        paramKey="channelId"
        paramValue={chatId}
        type={type}
      />
    </div>
  );
};

export default ClientChatPage;