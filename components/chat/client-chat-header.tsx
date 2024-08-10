// components/chat/client-chat-header.tsx
"use client";
import { useState, useEffect } from "react";
import { Hash, Search } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { SocketIndicator } from "@/components/socket-indicator";
import { ChatVideoButton } from "./chat-video-button";

interface Message {
  id: string;
  content: string;
}

interface ClientChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  messages: Message[];
  scrollToMessage: (id: string) => void;
}

const ClientChatHeader = ({
  serverId,
  name,
  type,
  imageUrl,
  messages,
  scrollToMessage,
}: ClientChatHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      const results = messages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(results);
    } else {
      setFilteredMessages([]);
    }
  }, [searchQuery, messages]);

  return (
    <>
      <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
        
        {type === "channel" && (
          <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />
        )}
        {type === "conversation" && (
          <UserAvatar 
            src={imageUrl}
            className="h-8 w-8 md:h-8 md:w-8 mr-2"
          />
        )}
        <p className="font-semibold text-md text-black dark:text-white">
          {name}
        </p>
        <div className="ml-auto flex items-center">
          {type === "conversation" && (
            <ChatVideoButton />
          )}
          <Search 
            className="w-5 h-5 text-zinc-500 dark:text-zinc-400  cursor-pointer"
            onClick={() => setSearchOpen(!searchOpen)}
          />
          <SocketIndicator />
        </div>
      </div>
      {searchOpen && (
        <div className="relative p-4 bg-gray-800">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full p-2 rounded-md bg-gray-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute top-full left-0 w-full bg-gray-900 text-white rounded-md mt-2 max-h-60 overflow-y-auto z-50">
              {filteredMessages.map((message) => (
                <div key={message.id} className="p-2 hover:bg-gray-700" onClick={() => scrollToMessage(message.id)}>
                  {message.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ClientChatHeader;
