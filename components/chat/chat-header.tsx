import { MobileToggle } from "@/components/mobile-toggle";
import { ChatHeaderClient } from "./chat-header-client"; // Import ChatHeaderClient

interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
}

export const ChatHeader = ({
  serverId,
  name,
  type,
  imageUrl
}: ChatHeaderProps) => {
  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
      <MobileToggle serverId={serverId} />
      <ChatHeaderClient
        serverId={serverId}
        name={name}
        type={type}
        imageUrl={imageUrl}
      />
    </div>
  )
}
