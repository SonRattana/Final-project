"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ open, onOpenChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [messageResults, setMessageResults] = useState([]);
  const params = useParams();
  const router = useRouter();

  const debounceSearch = useCallback(debounce((query) => {
    if (query.length > 0) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/searchMessages?query=${query}&channelId=${params?.channelId}`);
          if (!response.ok) throw new Error('Failed to fetch');
          const messages = await response.json();
          setMessageResults(messages);
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessageResults([]); // Clear results or handle error
        }
      };
  
      fetchMessages();
    }
  }, 300), [params?.channelId]);

  useEffect(() => {
    debounceSearch(searchQuery);
  }, [searchQuery, debounceSearch]);

  const onSelectMessage = (id: string) => {
    onOpenChange(false);
    const path = `/servers/${params?.serverId || 'defaultServerId'}/messages/${id}`;
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search messages"
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="px-2 py-2 rounded-md w-full border border-gray-300"
      />
      <CommandList className="max-h-60 overflow-y-auto">
        <CommandEmpty className="p-2 text-gray-500">No Results found</CommandEmpty>
        <CommandGroup heading="Messages">
          {messageResults.map((message: { id: string; content: string }) => (
            <CommandItem key={message.id} onSelect={() => onSelectMessage(message.id)} className="px-2 py-2 cursor-pointer hover:bg-gray-200">
              <span>{message.content}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

function debounce<T extends any[]>(func: (...args: T) => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: T) {
    const later = () => {
      clearTimeout(timeout as NodeJS.Timeout);
      func(...args);
    };
    clearTimeout(timeout as NodeJS.Timeout);
    timeout = setTimeout(later, wait);
  };
}
