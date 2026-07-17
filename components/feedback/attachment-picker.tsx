"use client";
import { useTranslation } from "@/lib/i18n/client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, Film } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import type { UploadedAttachment } from "@/lib/api/uploader";
import { resolveUploadUrl } from "@/lib/avatar";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENTS,
  validateAttachmentFile,
} from "@/lib/attachments";

interface AttachmentPickerProps {
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  /** Surface-specific upload (dashboard = authed, portal = public). */
  upload: (file: File) => Promise<UploadedAttachment>;
  /** Accent color for the add button (portal brand); defaults to rose. */
  brand?: string;
  disabled?: boolean;
}

/**
 * Attach photos / short video to a feedback post. Shared by the dashboard
 * "Create Post" dialog and the public portal submit form — the difference is
 * just the `upload` function passed in. Only rendered when the workspace plan
 * allows attachments; the caller gates that.
 */
export function AttachmentPicker({
  value,
  onChange,
  upload,
  brand = "#c74959",
  disabled,
}: AttachmentPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const atLimit = value.length >= MAX_ATTACHMENTS;

  const pick = () => inputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const room = MAX_ATTACHMENTS - value.length;
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    }

    const next: UploadedAttachment[] = [];
    setUploading(true);
    try {
      for (const file of chosen) {
        const problem = validateAttachmentFile(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        try {
          next.push(await upload(file));
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Couldn't upload that file.";
          toast.error(message);
        }
      }
      if (next.length > 0) onChange([...value, ...next]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (id: number) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((att) => (
            <div
              key={att.id}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#e399a3]/50 bg-[#fdf8f9]"
            >
              {att.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveUploadUrl(att.url)}
                  alt="attachment"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#c74959]">
                  <Film className="h-6 w-6" />
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(att.id)}
                aria-label={t("attachments.remove")}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1c0a0c]/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#e399a3] px-3 py-2 text-sm font-medium text-[#1c0a0c]/70 transition-colors hover:border-[#c74959] hover:text-[#c74959] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: brand }} />
          ) : (
            <Paperclip className="h-4 w-4" style={{ color: brand }} />
          )}
          {uploading ? t("attachments.uploading") : t("attachments.addMedia")}
        </button>
      )}

      <p className="text-xs text-[#1c0a0c]/40">
        Up to {MAX_ATTACHMENTS} files · images ≤10MB · video ≤50MB
      </p>
    </div>
  );
}
