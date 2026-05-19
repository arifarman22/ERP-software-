"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Bell, Package, AlertTriangle, CheckCircle } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  read: boolean;
  createdAt: string;
};

// In production, this would come from an API/WebSocket
const mockNotifications: Notification[] = [
  { id: "1", title: "Low Stock Alert", message: "Green Tea Premium is below minimum stock", type: "warning", read: false, createdAt: "2 min ago" },
  { id: "2", title: "Production Complete", message: "Batch BATCH-001 completed successfully", type: "success", read: false, createdAt: "1 hour ago" },
  { id: "3", title: "New Order", message: "Dealer ABC placed order #ORD-042", type: "info", read: true, createdAt: "3 hours ago" },
];

const typeIcons = {
  info: Package,
  warning: AlertTriangle,
  success: CheckCircle,
};

const typeColors = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  success: "text-green-500",
};

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            return (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => markRead(notification.id)}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColors[notification.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notification.createdAt}</p>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
