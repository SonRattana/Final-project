"use client";

import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { Edit, Hash, Lock, Mic, Trash, Video } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";
import { ModalType, useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";

interface ServerChannelProps {
  channel: Channel;
  server: Server;
  role?: MemberRole;
  userId: string;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

export const ServerChannel = ({
  channel,
  server,
  role,
  userId,
}: ServerChannelProps) => {
  const { onOpen } = useModal();
  const params = useParams();
  const router = useRouter();

  const { socket } = useSocket(); // Kết nối Socket.IO
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch số lượng thông báo chưa đọc từ server khi component mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.post(`/api/channels/${channel.id}`, {
          userId,
        });
        setUnreadCount(response.data.unreadCount); // Cập nhật số thông báo chưa đọc
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };
  
    // Thiết lập interval để gọi `fetchUnreadCount` liên tục
    const interval = setInterval(fetchUnreadCount, 2000); // Gọi mỗi 2 giây
  
    // Gọi ngay lập tức một lần khi component mount
    fetchUnreadCount();
  
    // Dọn dẹp interval khi component unmount
    return () => clearInterval(interval);
  }, [channel.id, userId]);
  

  // Lắng nghe thông báo mới từ Socket.IO (realtime)
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      console.log("New notification received:", notification);

      // Chỉ tăng thông báo nếu không phải của người gửi
      if (
        notification.channelId === channel.id &&
        notification.senderId !== userId
      ) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, channel.id, userId]);

  // Đánh dấu thông báo đã đọc khi nhấp vào channel
  const markAsRead = async () => {
    try {
      const response = await axios.post("/api/socket/notifications/mark-as-read", {
        userId,
        channelId: channel.id,
      });

      if (response.status === 200) {
        setUnreadCount(0); // Xóa badge thông báo nếu thành công
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const onClick = () => {
    markAsRead(); // Đánh dấu đã đọc khi nhấp vào kênh
    router.push(`/servers/${params?.serverId}/channels/${channel.id}`); // Điều hướng đến kênh
  };

  const onAction = (e: React.MouseEvent, action: ModalType) => {
    e.stopPropagation();
    onOpen(action, { channel, server });
  };

  const Icon = iconMap[channel.type];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
        params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700"
      )}
    >
      <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
      <p
        className={cn(
          "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.channelId === channel.id &&
            "text-primary dark:text-zinc-200 dark:group-hover:text-white"
        )}
      >
        {channel.name}
      </p>

      {/* Badge hiển thị số lượng thông báo chưa đọc */}
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {unreadCount}
        </span>
      )}
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="Edit">
            <Edit
              onClick={(e) => onAction(e, "editChannel")}
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
          <ActionTooltip label="Delete">
            <Trash
              onClick={(e) => onAction(e, "deleteChannel")}
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        </div>
      )}
      {channel.name === "general" && (
        <Lock className="ml-auto w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      )}
    </button>
  );
};
