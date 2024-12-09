"use client";

import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";

export const SocketIndicator = () => {
  const { isConnected } = useSocket();

  console.log("Socket connection status:", isConnected);

  if (!isConnected) {
    return (
      <Badge variant="outline" className="bg-green-600 text-white border-none">
        Live: Real-time updates
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-600 text-white border-none">
      Live: Real-time updates
    </Badge>
  );
};
