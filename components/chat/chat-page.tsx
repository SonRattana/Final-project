// components/chat/chat-page.tsx
import ClientChatPage from "./client-chat-page";
import { MobileToggle } from "@/components/mobile-toggle";

interface Message {
  id: string;
  content: string;
}

interface ChatPageProps {
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

const ChatPage: React.FC<ChatPageProps> = ({
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
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <MobileToggle serverId={serverId} />
      <ClientChatPage
        serverId={serverId}
        name={name}
        type={type}
        imageUrl={imageUrl}
        messages={messages}
        member={member}
        chatId={chatId}
        apiUrl={apiUrl}
        socketUrl={socketUrl}
        socketQuery={socketQuery}
      />
    </div>
  );
};

export default ChatPage;
