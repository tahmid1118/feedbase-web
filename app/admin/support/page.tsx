"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, Headset, CheckCircle2 } from "lucide-react";
import {
  adminApi,
  type SupportSessionRow,
  type AdminSupportMessage,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { LocalTime } from "@/components/local-time";
import { cn } from "@/lib/utils";
import {
  armNotificationSound,
  playNotificationBell,
} from "@/lib/notification-sound";
import { toast } from "sonner";

const POLL_LIST_MS = 8000;
const POLL_THREAD_MS = 4000;

type Tab = "open" | "closed";

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [tab, setTab] = useState<Tab>("open");
  const [sessions, setSessions] = useState<SupportSessionRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SupportSessionRow | null>(null);
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Total unread-from-user across the listed sessions (null = not yet primed) —
  // an increase means a new message landed in some session.
  const prevUnreadTotalRef = useRef<number | null>(null);
  // Newest user message id in the open thread — a jump means a fresh message.
  const lastUserIdRef = useRef<number | null>(null);
  const scrollToBottom = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    );

  // Enable the notification bell once the admin first interacts with the page.
  useEffect(() => {
    armNotificationSound();
  }, []);

  const loadList = useCallback(async () => {
    if (!token) return;
    const res = await adminApi.listSupportSessions(token, tab);
    if (res.ok) {
      const rows = res.data?.rows ?? [];
      setSessions(rows);
      const total = rows.reduce((sum, r) => sum + (r.unread_from_user || 0), 0);
      // Ring on a new user message in a session that isn't currently open (the
      // open one is caught by loadThread); never on the first baseline read.
      if (prevUnreadTotalRef.current !== null && total > prevUnreadTotalRef.current) {
        playNotificationBell();
      }
      prevUnreadTotalRef.current = total;
    }
  }, [token, tab]);

  useEffect(() => {
    let active = true;
    // Nested async keeps setState out of the effect body (React Compiler rule).
    const initial = async () => {
      setLoadingList(true);
      await loadList();
      if (active) setLoadingList(false);
    };
    initial();
    const t = setInterval(loadList, POLL_LIST_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [loadList]);

  const loadThread = useCallback(
    async (id: number, notify = false) => {
      if (!token) return;
      const res = await adminApi.getSupportSession(token, id);
      if (res.ok) {
        const msgs = res.data?.messages ?? [];
        setSelected(res.data?.session ?? null);
        setMessages(msgs);
        scrollToBottom();
        // Ring on a newly-arrived user message in the open conversation.
        const newestUser = msgs.reduce(
          (max, m) => (m.sender === "user" && m.id > max ? m.id : max),
          0
        );
        if (notify && lastUserIdRef.current !== null && newestUser > lastUserIdRef.current) {
          playNotificationBell();
        }
        lastUserIdRef.current = newestUser;
      }
    },
    [token]
  );

  // Load + poll the open conversation.
  useEffect(() => {
    if (selectedId === null) return;
    let active = true;
    let first = true;
    const run = () => {
      if (active) loadThread(selectedId, !first);
      first = false;
    };
    run();
    const t = setInterval(run, POLL_THREAD_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [selectedId, loadThread]);

  const openSession = (id: number) => {
    // Prime the thread ring so selecting a session doesn't ring on its history.
    lastUserIdRef.current = null;
    setSelectedId(id);
    setMessages([]);
    // Optimistically clear this row's unread badge; loadThread marks it read.
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, unread_from_user: 0 } : s))
    );
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !token || selectedId === null || sending) return;
    setSending(true);
    const optimistic: AdminSupportMessage = {
      id: -Date.now(),
      sender: "admin",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    scrollToBottom();
    const res = await adminApi.sendSupportMessage(token, selectedId, body);
    if (res.ok) {
      await loadThread(selectedId);
      loadList();
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
      toast.error(res.message || "Failed to send");
    }
    setSending(false);
  };

  const closeSession = async () => {
    if (!token || selectedId === null) return;
    const res = await adminApi.closeSupportSession(token, selectedId);
    if (res.ok) {
      toast.success(t("toast.chatClosed"));
      setSelected((s) => (s ? { ...s, status: "closed" } : s));
      loadList();
    } else {
      toast.error(res.message || "Failed to close");
    }
  };

  const displayName = (s: SupportSessionRow) =>
    s.user_name || s.user_email || "Unknown user";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.support")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Live chat with workspace users. Close a chat when it&apos;s resolved —
          the user loses access but the transcript stays here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Session queue */}
        <Card className="flex h-[calc(100vh-13rem)] flex-col overflow-hidden p-0">
          <div className="flex gap-1 border-b border-[#e399a3]/20 p-2">
            {(["open", "closed"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  // Re-prime so switching tabs (a different unread total) is silent.
                  prevUnreadTotalRef.current = null;
                  setTab(t);
                  setSelectedId(null);
                  setSelected(null);
                }}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-[#c74959] text-white"
                    : "text-[#1c0a0c]/60 hover:bg-[#fdf8f9]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex h-32 items-center justify-center text-[#1c0a0c]/40">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#1c0a0c]/50">
                No {tab} conversations.
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSession(s.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-[#e399a3]/15 px-4 py-3 text-left transition-colors",
                    selectedId === s.id ? "bg-[#c74959]/10" : "hover:bg-[#fdf8f9]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[#1c0a0c]">
                      {displayName(s)}
                    </span>
                    {s.unread_from_user > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c74959] px-1.5 text-[11px] font-bold text-white">
                        {s.unread_from_user}
                      </span>
                    )}
                  </div>
                  {s.workspace_name && (
                    <span className="truncate text-[11px] text-[#1c0a0c]/50">
                      {s.workspace_name}
                    </span>
                  )}
                  {s.last_message && (
                    <span className="truncate text-xs text-[#1c0a0c]/60">
                      {s.last_message}
                    </span>
                  )}
                  {s.last_message_at && (
                    <span className="text-[10px] text-[#1c0a0c]/40">
                      <LocalTime date={s.last_message_at} relative />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Conversation */}
        <Card className="flex h-[calc(100vh-13rem)] flex-col overflow-hidden p-0">
          {selected === null ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#1c0a0c]/40">
              <Headset className="h-10 w-10 text-[#e399a3]" />
              <p className="text-sm">{t("support.selectConversation")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-[#e399a3]/20 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1c0a0c]">
                    {displayName(selected)}
                  </p>
                  <p className="truncate text-[11px] text-[#1c0a0c]/50">
                    {selected.user_email}
                    {selected.workspace_name ? ` · ${selected.workspace_name}` : ""}
                  </p>
                </div>
                {selected.status === "open" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("support.closeChat")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("support.closeThisChat")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          The user will no longer see this conversation and can&apos;t
                          reply to it. You keep the full transcript here. They can
                          always start a new chat.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={closeSession}
                          className="bg-[#c74959] text-white transition-colors hover:bg-[#b03f4d]"
                        >
                          {t("support.closeChat")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Badge variant="outline" className="text-[11px]">
                    Closed
                  </Badge>
                )}
              </div>

              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[#fdf8f9] px-4 py-4"
              >
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#1c0a0c]/40">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col",
                        m.sender === "admin" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                          m.sender === "admin"
                            ? "rounded-br-sm bg-[#c74959] text-white"
                            : "rounded-bl-sm border border-[#e399a3]/40 bg-white text-[#1c0a0c]"
                        )}
                      >
                        {m.body}
                      </div>
                      <span className="mt-0.5 px-1 text-[10px] text-[#1c0a0c]/40">
                        {m.sender === "admin" ? "You · " : ""}
                        <LocalTime date={m.created_at} relative />
                      </span>
                    </div>
                  ))
                )}
              </div>

              {selected.status === "open" ? (
                <div className="border-t border-[#e399a3]/30 bg-white p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      placeholder={t("support.typeReply")}
                      className="max-h-28 flex-1 resize-none rounded-lg border border-[#e399a3]/40 bg-white px-3 py-2 text-sm text-[#1c0a0c] outline-none focus:border-[#c74959] focus:ring-1 focus:ring-[#c74959]/30"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!draft.trim() || sending}
                      aria-label="Send"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c74959] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-[#e399a3]/30 bg-white px-4 py-3 text-center text-xs text-[#1c0a0c]/50">
                  This chat is closed. The user can no longer see it.
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
