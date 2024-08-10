// components/chat/chat-member-page.tsx

import ClientMemberChatPage from "@/components/chat/client-member-chat-page";
import { MobileToggle } from "@/components/mobile-toggle";

interface Message {
  id: string;
  content: string;
}

interface ChatMemberPageProps {
  serverId: string;
  conversationId: string;
  member: any; // Replace with the correct type for member
  otherMember: any; // Replace with the correct type for member
  messages: Message[];
  searchParams: {
    video?: boolean;
  };
}

const ChatMemberPage: React.FC<ChatMemberPageProps> = ({
  serverId,
  conversationId,
  member,
  otherMember,
  messages,
  searchParams,
}) => {
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <MobileToggle serverId={serverId} />
    <ClientMemberChatPage
      serverId={serverId}
      conversationId={conversationId}
      member={member}
      otherMember={otherMember}
      messages={messages}
      searchParams={searchParams}
    />
    </div>
  );
};

export default ChatMemberPage;
