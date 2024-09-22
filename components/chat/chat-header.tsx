
import { MobileToggle } from "@/components/mobile-toggle";
import ClientChatHeader from "./client-chat-header";
interface Message {
  id: string;
  content: string;
}
interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  messages: Message[];
  scrollToMessage: (id: string) => void;
}

export const ChatHeader = ({
  serverId,
  name,
  type,
  imageUrl,
  messages,
  scrollToMessage
}: ChatHeaderProps) => {
  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
      
       <ClientChatHeader
      serverId={serverId}
      name={name}
      type={type}
      imageUrl={imageUrl}
      messages={messages}
      scrollToMessage={scrollToMessage}
    />
    </div>
  )
}