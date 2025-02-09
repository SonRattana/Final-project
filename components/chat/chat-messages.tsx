"use client";
import { Fragment, useRef, ElementRef, forwardRef, useImperativeHandle, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Member, Message, Profile } from "@prisma/client";
import { Loader2, ServerCrash } from "lucide-react";
import axios from 'axios';

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import io from "socket.io-client";
import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile
  },
  reactions?: { emoji: string; count: number }[]
};

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

export interface ChatMessagesRef {
  scrollToBottom: () => void;
  scrollToMessage: (id: string) => void;
}

export const ChatMessages = forwardRef<ChatMessagesRef, ChatMessagesProps>(({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
}, ref) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);
  const [socket, setSocket] = useState<any>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useChatQuery({
    queryKey,
    apiUrl,
    paramKey,
    paramValue,
  });

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(socketUrl, {
      path: "/api/socket/io",
      query: socketQuery,
      transports: ["websocket"],
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect(); // Disconnect on component unmount
    };
  }, [socketUrl, socketQuery]);

  // Add reaction to the message
  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await axios.post('/api/socket/reaction', {
        messageId,
        emoji,
        serverId: socketQuery.serverId,
        channelId: socketQuery.channelId,
      });
    } catch (error) {
      console.error("error when adding reaction:", error);
    }
  }, [socketQuery.serverId, socketQuery.channelId]);

  // Remove reaction from the message
  const handleRemoveReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await axios.delete('/api/socket/reaction', {
        data: {
          messageId,
          emoji,
          serverId: socketQuery.serverId,
          channelId: socketQuery.channelId,
        }
      });
    } catch (error) {
      console.error("error when removing reaction:", error);
    }
  }, [socketQuery.serverId, socketQuery.channelId]);

  useChatSocket({ queryKey, addKey, updateKey });
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.length ?? 0,
  });

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    scrollToMessage: (id: string) => {
      const messageElement = document.getElementById(id);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }));

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong!
        </p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto relative">
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && (
        <ChatWelcome
          type={type}
          name={name}
        />
      )}
      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((page, i) => (
          <Fragment key={i}>
            {page?.items?.map((message: MessageWithMemberWithProfile) => {
              if (!message.member || !member) {
                return null;
              }
              return (
                <ChatItem
                  key={message.id}
                  id={message.id}
                  currentMember={member}
                  member={message.member}
                  content={message.content}
                  fileUrl={message.fileUrl}
                  deleted={message.deleted}
                  timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                  isUpdated={message.updatedAt !== message.createdAt}
                  socketUrl={socketUrl}
                  socketQuery={socketQuery}
                  reactions={message.reactions}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                  taggedUsers={message.taggedUsers || []}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
})

ChatMessages.displayName = "ChatMessages";
