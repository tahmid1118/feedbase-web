"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Blocks a SECOND tab of an already-open dashboard on single-device plans.
 *
 * The backend can't do this: a new tab reuses the same session cookie, so there
 * is no login event and no new device session to refuse. The only thing that can
 * see "this browser already has the app open" is the browser itself — hence a
 * BroadcastChannel handshake between tabs of the same origin.
 *
 * Protocol: a new tab broadcasts `claim`; any tab already holding the app replies
 * `taken`, and the claimant renders a blocking screen instead of the app. When
 * the holder goes away it broadcasts `released`, and a blocked tab re-claims
 * automatically — so closing the original frees this one with no manual reload.
 *
 * Business (multiDevice) skips this entirely.
 */
const CHANNEL = "feedbase-tabs";

type TabMessage =
  | { type: "claim"; from: string; at: number }
  | { type: "taken"; to: string }
  | { type: "released" };

export function SingleTabGuard({ multiDevice }: { multiDevice: boolean }) {
  const [blocked, setBlockedState] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Identity is minted inside the effect — Math.random()/Date.now() are impure
  // and must not run during render.
  const idRef = useRef("");
  const atRef = useRef(0);

  // The message handler runs outside React's render cycle and must see the
  // CURRENT blocked state — a blocked tab holds nothing, so it must never answer
  // another tab's claim. State alone would be stale inside the closure, so the
  // ref is the source of truth and the state exists only to re-render.
  const blockedRef = useRef(false);
  const setBlocked = useCallback((value: boolean) => {
    blockedRef.current = value;
    setBlockedState(value);
  }, []);

  const claim = useCallback(() => {
    setBlocked(false);
    channelRef.current?.postMessage({
      type: "claim",
      from: idRef.current,
      at: atRef.current,
    } as TabMessage);
  }, [setBlocked]);

  useEffect(() => {
    if (multiDevice || typeof BroadcastChannel === "undefined") return;

    if (!idRef.current) {
      idRef.current = Math.random().toString(36).slice(2);
      atRef.current = Date.now();
    }
    const myId = idRef.current;
    const myAt = atRef.current;
    const channel = new BroadcastChannel(CHANNEL);
    channelRef.current = channel;

    // Who wins when two tabs claim at once? The one opened first. Without this
    // tiebreak, two tabs opened simultaneously would each object to the other
    // and BOTH would lock themselves out.
    const iWasHereFirst = (their: { from: string; at: number }) =>
      myAt !== their.at ? myAt < their.at : myId < their.from;

    channel.onmessage = (event: MessageEvent<TabMessage>) => {
      const message = event.data;
      if (!message) return;

      // Another tab is opening the app. Object only if we hold it — i.e. we're
      // not blocked ourselves and we got here first.
      if (
        message.type === "claim" &&
        message.from !== myId &&
        !blockedRef.current &&
        iWasHereFirst(message)
      ) {
        channel.postMessage({ type: "taken", to: message.from } as TabMessage);
        return;
      }
      // The holder objected to *our* claim — we're the duplicate.
      if (message.type === "taken" && message.to === myId) {
        setBlocked(true);
        return;
      }
      // The holder closed; if we were blocked, take over.
      if (message.type === "released" && blockedRef.current) {
        setBlocked(false);
        channel.postMessage({
          type: "claim",
          from: myId,
          at: myAt,
        } as TabMessage);
      }
    };

    // Silence ⇒ no other tab holds the app ⇒ this one does.
    channel.postMessage({ type: "claim", from: myId, at: myAt } as TabMessage);

    const release = () => {
      if (!blockedRef.current) {
        channel.postMessage({ type: "released" } as TabMessage);
      }
    };
    window.addEventListener("pagehide", release);

    return () => {
      window.removeEventListener("pagehide", release);
      release();
      channel.close();
      channelRef.current = null;
    };
  }, [multiDevice, setBlocked]);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c0a0c]/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#e399a3]/50 bg-gradient-to-b from-white to-[#fdf8f9] p-7 text-center shadow-xl ring-1 ring-[#c74959]/10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c74959]/10">
          <MonitorSmartphone className="h-6 w-6 text-[#c74959]" />
        </div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-[#1c0a0c]">
          Feedbase is already open
        </h2>
        <p className="mb-6 text-sm text-[#1c0a0c]/70">
          Your plan allows one session at a time, and Feedbase is already open in
          another tab or window. Head back to it and close this one — or upgrade
          to Business to work across several tabs and devices.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            className="h-10 w-full bg-[#c74959] hover:bg-[#b53f4d]"
            onClick={() =>
              window.location.assign("/dashboard/settings?tab=billing")
            }
          >
            Upgrade to Business
          </Button>
          <Button variant="outline" className="h-10 w-full" onClick={claim}>
            I closed the other tab — continue here
          </Button>
        </div>
      </div>
    </div>
  );
}
