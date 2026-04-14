"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check } from "lucide-react";
import { notificationsApi, type Notification } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!session?.user?.accessToken) return;

    try {
      setLoading(true);
      const response = await notificationsApi.list(
        {
          itemsPerPage: 50,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
        },
        session.user.accessToken
      );

      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!session?.user?.accessToken) return;

    try {
      await notificationsApi.markRead(id, session.user.accessToken);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user?.accessToken) return;

    try {
      await notificationsApi.markAllRead(session.user.accessToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">Loading notifications...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">Notifications</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-[#c74959]"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-[#1c0a0c]/30" />
          <p className="mt-4 text-[#1c0a0c]/60">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 ${notification.is_read === 0 ? "border-l-4 border-l-[#c74959] bg-[#fdf8f9]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-[#1c0a0c]">
                    {notification.title}
                  </h4>
                  <p className="mt-1 text-sm text-[#1c0a0c]/70">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-[#1c0a0c]/50">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString()
                      : "Recently"}
                  </p>
                </div>
                {notification.is_read === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
