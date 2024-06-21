"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessageSearch = ({ open, onOpenChange }: MessageSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [messageResults, setMessageResults] = useState([]);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchMessages = async () => {
        const response = await fetch(`/api/searchMessages?query=${searchQuery}&channelId=${params?.channelId}`);
        const messages = await response.json();
        setMessageResults(messages);
      };

      fetchMessages();
    }
  }, [searchQuery, params?.channelId]);

  const onClick = (id: string) => {
    onOpenChange(false);
    router.push(`/servers/${params?.serverId}/channels/${params?.channelId}?messageId=${id}`);
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
            <CommandItem key={message.id} onSelect={() => onClick(message.id)} className="px-2 py-2 cursor-pointer hover:bg-gray-200">
              <span>{message.content}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
