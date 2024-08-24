// components/ui/NotificationBadge.tsx
"use client"
import React from 'react';

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count === 0) {
    return null;
  }

  return (
    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
      {count}
    </span>
  );
};

export default NotificationBadge;
