"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { notificationsApi, extractRows, type Notification } from "@/lib/api";
import { emitNotificationsChanged } from "@/lib/notifications-events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

/** Resolve a deep link for a notification from its reference, when possible. */
function notificationHref(notification: Notification): string | null {
  const { reference_type, reference_id } = notification;
  if (!reference_id) return null;
  switch (reference_type) {
    case "post":
      return `/dashboard/feedback/${reference_id}`;
    case "changelog":
      return `/dashboard/changelog/${reference_id}`;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await notificationsApi.list(
        {
          itemsPerPage: 50,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
        },
        token
      );
      setNotifications(
        extractRows<Notification>(response.data, "notifications")
      );
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const deleteNotification = async (id: number) => {
    if (!token) return;
    try {
      await notificationsApi.delete(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      emitNotificationsChanged(); // deleting an unread one changes the count
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      await notificationsApi.markRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      emitNotificationsChanged();
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await notificationsApi.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      emitNotificationsChanged();
      toast.success("All notifications marked as read");
    } catch {
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
                  {(() => {
                    const href = notificationHref(notification);
                    const title = (
                      <h4 className="font-medium text-[#1c0a0c]">
                        {notification.title}
                      </h4>
                    );
                    return href ? (
                      <Link
                        href={href}
                        onClick={() => {
                          if (notification.is_read === 0)
                            markAsRead(notification.id);
                        }}
                        className="hover:text-[#c74959] hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      title
                    );
                  })()}
                  <p className="mt-1 text-sm text-[#1c0a0c]/70">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-[#1c0a0c]/50">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString()
                      : "Recently"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {notification.is_read === 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notification.id)}
                    aria-label="Delete notification"
                    className="text-[#1c0a0c]/50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
