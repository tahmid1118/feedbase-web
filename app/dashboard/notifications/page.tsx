"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import {
  notificationsApi,
  extractRows,
  parseJsonField,
  type Notification,
  type NotificationMeta,
} from "@/lib/api";
import { emitNotificationsChanged } from "@/lib/notifications-events";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { LocalTime } from "@/components/local-time";

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
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

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
      toast.success(t("toast.notifDeleted"));
    } catch {
      toast.error(t("notif.deleteFailed"));
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
      toast.success(t("toast.markedRead"));
    } catch {
      toast.error(t("notif.markReadFailed"));
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await notificationsApi.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      emitNotificationsChanged();
      toast.success(t("toast.allNotifsRead"));
    } catch {
      toast.error(t("notif.markAllFailed"));
    }
  };

  const clearAll = async () => {
    if (!token) return;
    setClearing(true);
    try {
      await notificationsApi.clearAll(token);
      setNotifications([]);
      emitNotificationsChanged();
      toast.success(t("toast.allNotifsCleared"));
    } catch {
      toast.error(t("notif.clearFailed"));
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">{t("notifications.loading")}</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  // `title`/`message` are frozen English from when the event happened. When the
  // row carries structured `meta` we re-render the text in the reader's
  // language; older rows (written before `meta` existed) fall back to the
  // stored English.
  const metaOf = (n: Notification): NotificationMeta | null =>
    parseJsonField<NotificationMeta | null>(n.meta, null);

  const notificationTitle = (n: Notification) => {
    const meta = metaOf(n);
    if (meta?.key === "comment" && meta.postTitle) {
      return t("notif.commentTitle", { postTitle: meta.postTitle });
    }
    return n.title;
  };

  const notificationMessage = (n: Notification) => {
    const meta = metaOf(n);
    if (meta?.key === "comment" && meta.body) {
      // "Someone" is the backend's placeholder for an unidentified commenter.
      const who = !meta.who || meta.who === "Someone" ? t("notif.someone") : meta.who;
      return t("notif.commentMessage", { who, body: meta.body });
    }
    return n.message;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("nav.notifications")}</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            {unreadCount > 0
              ? t("notif.nUnread", { count: unreadCount })
              : t("notif.allCaughtUp")}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-[#c74959]"
              >
                <Check className="h-4 w-4" />
                {t("notif.markAllAsRead")}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#1c0a0c]/60 hover:border-red-300 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("notif.clearAll")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("notif.clearAllConfirm")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("notif.clearAllDesc", { count: notifications.length })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={clearing}>
                    {t("common.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAll}
                    disabled={clearing}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {clearing ? "Clearing…" : "Clear all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-[#1c0a0c]/30" />
          <p className="mt-4 text-[#1c0a0c]/60">{t("notifications.empty")}</p>
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
                        {notificationTitle(notification)}
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
                    {notificationMessage(notification)}
                  </p>
                  <p className="mt-2 text-xs text-[#1c0a0c]/50">
                    {notification.created_at ? (
                      <LocalTime date={notification.created_at} />
                    ) : (
                      t("portal.recently")
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {notification.is_read === 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                      aria-label={t("notif.markAsRead")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notification.id)}
                    aria-label={t("notif.deleteNotification")}
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
