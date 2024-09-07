"use client"
import { useEffect, useState } from "react";
import io from "socket.io-client";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const NotificationList = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: "/api/socket/io", // Ensure this matches your server setup
    });

    // Join the user’s room based on their userId
    socket.emit("join", userId);

    // Listen for new notifications
    socket.on("new_notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            {notification.message} - {new Date(notification.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;
