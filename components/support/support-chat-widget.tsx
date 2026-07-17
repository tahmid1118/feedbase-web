"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Loader2, Headset } from "lucide-react";
import { supportApi, ApiError, type SupportMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/local-time";

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
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  // Badge poll — runs while the panel is CLOSED so the user notices a reply.
  useEffect(() => {
    if (!token || open) return;
    let active = true;
    const tick = async () => {
      try {
        const res = await supportApi.unread(token);
        if (active) setUnread(res.data?.unreadCount ?? 0);
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
    async (id: number) => {
      if (!token) return;
      try {
        const res = await supportApi.listMessages(id, token);
        setMessages(res.data?.messages ?? []);
        setClosedByAdmin(false);
        scrollToBottom();
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

  // Start (or resume) a session when the panel opens.
  const startSession = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setClosedByAdmin(false);
    try {
      const res = await supportApi.openSession(token);
      const id = res.data?.session.id ?? null;
      setSessionId(id);
      if (id) await loadMessages(id);
      setUnread(0);
    } catch {
      /* surfaced by the empty state */
    } finally {
      setLoading(false);
    }
  }, [token, loadMessages]);

  useEffect(() => {
    if (open && sessionId === null && !closedByAdmin) startSession();
  }, [open, sessionId, closedByAdmin, startSession]);

  // Message poll — runs while the panel is OPEN on an active session.
  useEffect(() => {
    if (!open || sessionId === null) return;
    const t = setInterval(() => loadMessages(sessionId), POLL_MESSAGES_MS);
    return () => clearInterval(t);
  }, [open, sessionId, loadMessages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !token || sessionId === null || sending) return;
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
      await supportApi.sendMessage(sessionId, body, token);
      await loadMessages(sessionId);
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
          onClick={() => setOpen(true)}
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
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-[#1c0a0c]/70">
                  This chat was closed by support. Start a new one if you still need help.
                </p>
                <Button size="sm" onClick={startSession}>
                  Start new chat
                </Button>
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
                  disabled={loading || sessionId === null}
                  className="max-h-28 flex-1 resize-none rounded-lg border border-[#e399a3]/40 bg-white px-3 py-2 text-sm text-[#1c0a0c] outline-none focus:border-[#c74959] focus:ring-1 focus:ring-[#c74959]/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending || sessionId === null}
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
