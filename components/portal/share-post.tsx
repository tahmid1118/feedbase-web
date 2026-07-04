"use client";

import { useEffect, useState } from "react";
import { Share2, Link2, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type IntentBuilder = (url: string, text: string) => string;

const SOCIALS: { name: string; build: IntentBuilder }[] = [
  {
    name: "X",
    build: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    name: "LinkedIn",
    build: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  },
  {
    name: "Facebook",
    build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    name: "WhatsApp",
    build: (u, t) => `https://wa.me/?text=${t}%20${u}`,
  },
  {
    name: "Email",
    build: (u, t) => `mailto:?subject=${t}&body=${u}`,
  },
];

/**
 * Public share control for a feedback post. Copies the current page URL, offers
 * the device's native share sheet (mobile), and opens social share intents. The
 * link itself unfurls richly thanks to the page's Open Graph metadata + image.
 */
export function SharePost({ title, brand }: { title: string; brand: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const currentUrl = () =>
    typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: currentUrl() });
      setOpen(false);
    } catch {
      /* user cancelled — no-op */
    }
  };

  const openSocial = (build: IntentBuilder) => {
    const u = encodeURIComponent(currentUrl());
    const t = encodeURIComponent(title);
    window.open(
      build(u, t),
      "_blank",
      "noopener,noreferrer,width=600,height=520"
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <p className="text-sm font-semibold text-[#1c0a0c]">Share this post</p>

        <button
          type="button"
          onClick={copy}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-[#e399a3]/40 bg-[#fdf8f9] px-3 py-2 text-left text-sm text-[#1c0a0c]/70 transition-colors hover:border-[#c74959]/50"
        >
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <Link2 className="h-4 w-4 shrink-0 text-[#1c0a0c]/50" />
          )}
          <span className="flex-1 truncate">
            {copied ? "Link copied!" : "Copy link"}
          </span>
        </button>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SOCIALS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => openSocial(s.build)}
              className="rounded-full border border-[#e399a3]/40 px-3 py-1 text-xs font-medium text-[#1c0a0c]/70 transition-colors hover:border-[#c74959]/50 hover:text-[#c74959]"
            >
              {s.name}
            </button>
          ))}
        </div>

        {canNativeShare && (
          <Button
            onClick={nativeShare}
            className="mt-3 w-full gap-1.5 text-white hover:opacity-90"
            style={{ backgroundColor: brand }}
            size="sm"
          >
            <Send className="h-4 w-4" />
            Share via…
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
