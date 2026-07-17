"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Headset,
  MessageCirclePlus,
} from "lucide-react";
import { supportApi, ApiError, type SupportMessage } from "@/lib/api";
import { LocalTime } from "@/components/local-time";
import {
  armNotificationSound,
  playNotificationBell,
} from "@/lib/notification-sound";

/**
 * Floating "Contact support" widget available on every dashboard page, for every
 * role and plan. Opens a chat with the platform admin. Real-time via polling
 * (no WebSocket infra): the open panel polls messages every 4s; the badge polls
 * unread every 15s. A session the admin closes disappears (reads 403) and the
 * user can start a fresh one.
 */

const POLL_MESSAGES_MS = 4000;
const POLL_UNREAD_MS = 15000;

export function SupportChatWidget() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closedByAdmin, setClosedByAdmin] = useState(false);
  const [unread, setUnread] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Newest admin message id seen (open panel) — a jump means a fresh reply.
  const lastAdminIdRef = useRef<number | null>(null);
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  // Enable the notification bell once the user first interacts with the page.
  useEffect(() => {
    armNotificationSound();
  }, []);

  // Badge poll — runs while the panel is CLOSED so the user notices a reply.
  useEffect(() => {
    if (!token || open) return;
    let active = true;
    let first = true;
    let prev = 0;
    const tick = async () => {
      try {
        const res = await supportApi.unread(token);
        if (!active) return;
        const count = res.data?.unreadCount ?? 0;
        setUnread(count);
        // Ring when a new reply lands (but never on the first baseline read).
        if (!first && count > prev) playNotificationBell();
        prev = count;
        first = false;
      } catch {
        /* transient — keep the last value */
      }
    };
    tick();
    const t = setInterval(tick, POLL_UNREAD_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [token, open]);

  const loadMessages = useCallback(
    async (id: number, notify = false) => {
      if (!token) return;
      try {
        const res = await supportApi.listMessages(id, token);
        const msgs = res.data?.messages ?? [];
        setMessages(msgs);
        setClosedByAdmin(false);
        scrollToBottom();
        // Ring on a newly-arrived admin reply while the panel is open.
        const newestAdmin = msgs.reduce(
          (max, m) => (m.sender === "admin" && m.id > max ? m.id : max),
          0
        );
        if (notify && lastAdminIdRef.current !== null && newestAdmin > lastAdminIdRef.current) {
          playNotificationBell();
        }
        lastAdminIdRef.current = newestAdmin;
      } catch (err) {
        // 403 = the admin closed this session; it's no longer the user's to see.
        if (err instanceof ApiError && err.status === 403) {
          setClosedByAdmin(true);
          setSessionId(null);
        }
      }
    },
    [token]
  );

  // Resume the user's existing open session WITHOUT creating one — a session is
  // only created on the first message (see handleSend), so opening the widget and
  // leaving never leaves an empty conversation in the admin's queue. `unread`
  // returns the open session id if there is one.
  const resumeSession = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setClosedByAdmin(false);
    try {
      const res = await supportApi.unread(token);
      const data = res.data;
      if (data?.hasOpenSession && data.sessionId) {
        setSessionId(data.sessionId);
        await loadMessages(data.sessionId);
        setUnread(0);
      } else {
        setSessionId(null);
        setMessages([]);
        lastAdminIdRef.current = null;
      }
    } catch {
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  }, [token, loadMessages]);

  const openPanel = () => {
    setOpen(true);
    resumeSession();
  };

  // Reset to a fresh, empty composer (no session created until first send).
  const newChat = () => {
    setClosedByAdmin(false);
    setMessages([]);
    setSessionId(null);
    lastAdminIdRef.current = null;
  };

  // Message poll — runs while the panel is OPEN on an active session.
  useEffect(() => {
    if (!open || sessionId === null) return;
    const t = setInterval(() => loadMessages(sessionId, true), POLL_MESSAGES_MS);
    return () => clearInterval(t);
  }, [open, sessionId, loadMessages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !token || sending) return;
    setSending(true);
    // Optimistic append so the input feels instant; the poll reconciles ids.
    const optimistic: SupportMessage = {
      id: -Date.now(),
      sender: "user",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    scrollToBottom();
    try {
      // Create the session lazily on the first message.
      let id = sessionId;
      if (id === null) {
        const res = await supportApi.openSession(token);
        id = res.data?.session.id ?? null;
        if (id === null) throw new Error("could not open session");
        setSessionId(id);
      }
      await supportApi.sendMessage(id, body, token);
      await loadMessages(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setClosedByAdmin(true);
        setSessionId(null);
      } else {
        // Roll the optimistic message back and restore the draft.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(body);
      }
    } finally {
      setSending(false);
    }
  };

  if (!token) return null;

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label="Contact support"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#c74959] text-white shadow-lg shadow-[#c74959]/30 transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#fdf8f9] bg-[#1c0a0c] px-1 text-[11px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[calc(100vh-2.5rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-[#e399a3]/50 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#c74959] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Headset className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">Support</p>
                <p className="text-[11px] text-white/80">We usually reply within a day</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1 hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#fdf8f9] px-4 py-4"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-[#1c0a0c]/50">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : closedByAdmin ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c74959]/10">
                  <Headset className="h-7 w-7 text-[#c74959]" />
                </div>
                <p className="text-sm text-[#1c0a0c]/70">
                  This chat was closed by support. Start a new one if you still need help.
                </p>
                <button
                  type="button"
                  onClick={newChat}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#c74959] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#c74959]/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#c74959]/40 active:translate-y-0 active:scale-95"
                >
                  <MessageCirclePlus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  Start new chat
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-[#1c0a0c]/50">
                <MessageCircle className="mb-1 h-8 w-8 text-[#e399a3]" />
                <p className="text-sm">Send a message and our team will get back to you.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      m.sender === "user"
                        ? "rounded-br-sm bg-[#c74959] text-white"
                        : "rounded-bl-sm border border-[#e399a3]/40 bg-white text-[#1c0a0c]"
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-[#1c0a0c]/40">
                    {m.sender === "admin" ? "Support · " : ""}
                    <LocalTime date={m.created_at} relative />
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          {!closedByAdmin && (
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
                  placeholder="Type your message…"
                  disabled={loading}
                  className="max-h-28 flex-1 resize-none rounded-lg border border-[#e399a3]/40 bg-white px-3 py-2 text-sm text-[#1c0a0c] outline-none focus:border-[#c74959] focus:ring-1 focus:ring-[#c74959]/30 disabled:opacity-50"
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
          )}
        </div>
      )}
    </>
  );
}
