"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, Profile } from "@prisma/client";
import {
  Edit,
  FileIcon,
  ShieldAlert,
  ShieldCheck,
  Trash,
  Reply,
  Smile,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import React, { MouseEventHandler, ReactNode } from "react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";
import { io } from "socket.io-client";

interface Reaction {
  emoji: string;
  count: number;
  members?: { id: string; name: string; imageUrl: string }[];
}

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onReply?: (messageId: string, content: string) => void;
  replyTo?: ChatItemProps | null;
  onReaction: (messageId: string, emoji: string) => void;
  reactions?: Reaction[];
}

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-yellow-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-green-500" />,
};

const formSchema = z.object({
  content: z.string().min(1),
});

const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
  onClick,
  onReply,
  replyTo = null,
  onReaction,
  reactions = [],
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [reactionMembers, setReactionMembers] = useState<
    Record<string, { id: string; name: string; imageUrl: string }[]>
  >({});
  const { onOpen } = useModal();
  const params = useParams();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    const socket = io(socketUrl, {
      path: "/api/socket/io",
      query: socketQuery,
      transports: ["websocket", "polling"],
    });

    socket.on("reaction_added", ({ messageId, reactions }) => {
      if (messageId === id) {
        setLocalReactions(reactions);
      }
    });

    socket.on("reaction_removed", ({ messageId, reactions }) => {
      if (messageId === id) {
        setLocalReactions(reactions);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, socketUrl, socketQuery]);

  const onMemberClick = () => {
    if (member.id === currentMember.id) {
      return;
    }
    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
        setIsReplying(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });

  const replyForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const isReplyLoading = replyForm.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      await axios.patch(url, values);
      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    form.reset({ content });
  }, [content]);

  const fileType = fileUrl?.split(".").pop();

  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const canReplyMessage = !deleted && currentMember.id !== member.id;
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;

  const handleAddReaction = async (emoji: string) => {
    try {
      setLocalReactions((prevReactions) => {
        const existingReaction = prevReactions.find((r) => r.emoji === emoji);
        if (existingReaction) {
          return prevReactions.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
          );
        } else {
          return [...prevReactions, { emoji, count: 1 }];
        }
      });

      await axios.post("/api/socket/reaction", {
        messageId: id,
        emoji,
      });

      setShowEmojiMenu(false);
    } catch (error) {
      console.error("error add reaction:", error);
      setLocalReactions(reactions);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    try {
      // Tìm reaction dựa trên emoji và kiểm tra người dùng hiện tại có nằm trong danh sách những người đã thả reaction hay không
      const reaction = localReactions.find((r) => r.emoji === emoji);

      // Người dùng được phép xóa reaction của họ
      setLocalReactions((prevReactions) => {
        const existingReaction = prevReactions.find((r) => r.emoji === emoji);
        if (existingReaction && existingReaction.count > 1) {
          return prevReactions.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count - 1 } : r
          );
        } else {
          return prevReactions.filter((r) => r.emoji !== emoji);
        }
      });

      await axios.delete("/api/socket/reaction", {
        data: {
          messageId: id,
          emoji,
        },
      });
    } catch (error) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      setLocalReactions(reactions);
    }
  };

  const handleShowReactionMembers = async (emoji: string) => {
    try {
      const response = await axios.get(`/api/socket/reaction`, {
        params: {
          messageId: id,
          emoji: encodeURIComponent(emoji),
        },
      });
      setReactionMembers((prev) => ({ ...prev, [emoji]: response.data }));
    } catch (error) {
      console.error("error show reaction members:", error);
    }
  };

  useEffect(() => {
    const closeEmojiMenu = (e: MouseEvent) => {
      if (showEmojiMenu && !(e.target as HTMLElement).closest(".emoji-menu")) {
        setShowEmojiMenu(false);
      }
    };
    document.addEventListener("click", closeEmojiMenu);
    return () => document.removeEventListener("click", closeEmojiMenu);
  }, [showEmojiMenu]);

  return (
    <div
      id={id}
      className="chat-item relative group flex items-center hover:bg-black/5 p-4 transition w-full"
      onClick={onClick}
    >
      <div className="group flex gap-x-2 items-start w-full">
        <div
          onClick={onMemberClick}
          className="cursor-pointer hover:drop-shadow-md transition"
        >
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p
                onClick={onMemberClick}
                className="font-semibold text-sm hover:underline cursor-pointer"
              >
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {isImage && (
            <div className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48">
              <Image src={fileUrl} alt="Image" fill className="object-cover" />
            </div>
          )}

          {!isImage && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}

          {isImage && content && !content.startsWith("http") && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}

          <div className="flex flex-wrap mt-1">
            {localReactions
              .reduce<Reaction[]>((acc, { emoji, count, members }) => {
                const existingReaction = acc.find((r) => r.emoji === emoji);
                if (existingReaction) {
                  existingReaction.count += count;
                } else {
                  acc.push({ emoji, count, members });
                }
                return acc;
              }, [])
              .map(({ emoji, count, members }) => (
                <ActionTooltip
                  key={emoji}
                  label={
                    <div>
                      {members?.map((member) => (
                        <div key={member.id}>{member.name}</div>
                      ))}
                    </div>
                  }
                >
                  <button
                    onClick={() => handleRemoveReaction(emoji)}
                    onMouseEnter={() => handleShowReactionMembers(emoji)}
                    className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 text-sm mr-2 mb-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    <span>{emoji}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </button>
                </ActionTooltip>
              ))}
          </div>

          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                            placeholder="Edited message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button disabled={isLoading} size="sm" variant="primary">
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
        <div className="relative">
          <ActionTooltip label="React">
            <Smile
              onClick={() => setShowEmojiMenu(!showEmojiMenu)}
              className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
          {showEmojiMenu && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-zinc-800 border rounded-md shadow-lg p-2 z-10">
              <div className="flex space-x-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleAddReaction(emoji);
                      setShowEmojiMenu(false);
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-zinc-700 p-1 rounded-full"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {canEditMessage && (
          <ActionTooltip label="Edit">
            <Edit
              onClick={() => setIsEditing(true)}
              className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        )}
        {canDeleteMessage && (
          <ActionTooltip label="Delete">
            <Trash
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                })
              }
              className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        )}
      </div>
      {showAlert && (
        <div className="flex flex-col gap-2 w-60 sm:w-72 text-[10px] sm:text-xs z-50">
          <div
            className="warning-alert cursor-default flex items-center justify-between w-full h-12 sm:h-14 rounded-lg px-[10px]
    bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200"
          >
            <div className="flex gap-2">
              <div className="flex items-center justify-center bg-red-300 dark:bg-red-800 p-1 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-8 h-8 text-red-600" 
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-red-800 dark:text-red-200">Warning</p>{" "}
                <p className="text-red-600 dark:text-red-300">
                  You can not delete this reaction from others!
                </p>
              </div>
            </div>
            <button
              className="text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 p-1 rounded-md transition-colors ease-linear"
              onClick={() => setShowAlert(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
