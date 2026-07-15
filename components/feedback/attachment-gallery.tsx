"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { PostAttachment } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/avatar";

/**
 * Renders a feedback post's photo/video attachments: images in a thumbnail grid
 * that open full-size in a lightbox, video inline with native controls. Used on
 * the public portal post detail and the dashboard feedback detail.
 */
export function AttachmentGallery({
  attachments,
}: {
  attachments?: PostAttachment[] | null;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.kind === "image");
  const videos = attachments.filter((a) => a.kind === "video");

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((att) => {
            const src = resolveUploadUrl(att.url);
            return (
              <button
                key={att.id}
                type="button"
                onClick={() => src && setLightbox(src)}
                className="overflow-hidden rounded-xl border border-[#e399a3]/40 bg-[#fdf8f9] transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={att.original_name || "attachment"}
                  className="h-40 w-40 object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {videos.map((att) => (
        <video
          key={att.id}
          src={resolveUploadUrl(att.url)}
          controls
          preload="metadata"
          className="max-h-[420px] w-full max-w-lg rounded-xl border border-[#e399a3]/40 bg-black"
        />
      ))}

      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c0a0c]/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="attachment"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
