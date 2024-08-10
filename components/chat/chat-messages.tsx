// components/chat/chat-messages.tsx

"use client";
import { Fragment, useRef, ElementRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { format } from "date-fns";
import { Member, Message, Profile } from "@prisma/client";
import { Loader2, ServerCrash } from "lucide-react";
import { useParams } from "next/navigation";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";

import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";
import { useChatScroll } from "@/hooks/use-chat-scroll";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile
  }
}

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
  searchQuery?: string;
  searchResults?: Array<{ id: string; content: string }>;
}

export interface ChatMessagesRef {
  scrollToMessage: (messageId: string) => void;
}

const ChatMessages = forwardRef<ChatMessagesRef, ChatMessagesProps>(({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
  searchQuery,
  searchResults,
}, ref) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);
  const params = useParams();

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
  useChatSocket({ queryKey, addKey, updateKey });
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  useImperativeHandle(ref, () => ({
    scrollToMessage: (messageId: string) => {
      const element = document.getElementById(messageId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlight");
        setTimeout(() => {
          element.classList.remove("highlight");
        }, 2000);
      }
    }
  }));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get("messageId");
    if (messageId) {
      const element = document.getElementById(messageId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlight");
        setTimeout(() => {
          element.classList.remove("highlight");
        }, 2000);
      }
    }
  }, [data]);

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong!
        </p>
      </div>
    )
  }

  const messagesToDisplay = searchQuery && searchResults?.length ? searchResults : data?.pages?.flatMap(page => page.items);

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto relative">
      {!hasNextPage && !searchQuery && <div className="flex-1" />}
      {!hasNextPage && !searchQuery && (
        <ChatWelcome
          type={type}
          name={name}
        />
      )}
      {hasNextPage && !searchQuery && (
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
        {messagesToDisplay?.map((message: MessageWithMemberWithProfile) => (
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
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
});

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
