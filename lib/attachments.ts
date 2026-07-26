/**
 * Client-side attachment rules — kept in step with the backend
 * (`src/common/file-upload/attachment-const-value.js`). These give instant
 * feedback in the picker; the backend re-validates and is the source of truth.
 */

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Profile avatars and the workspace logo — a DIFFERENT endpoint
 * (`/uploader/upload-image`) with its own list on the backend
 * (`src/common/file-upload/upload-file-const-value.js`). Keep them in step.
 *
 * Use this for the picker's `accept` instead of `image/*`: that offered the user
 * every image format the OS knows (HEIC from a phone, SVG, BMP) and let them
 * pick one the API then rejected — an avoidable round trip and a confusing
 * "Failed to upload image".
 */
export const PROFILE_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
];

/** For an <input type="file" accept="…"> on avatar / logo pickers. */
export const PROFILE_IMAGE_ACCEPT = PROFILE_IMAGE_MIME_TYPES.join(",");

/** For an <input type="file" accept="…"> that allows both. */
export const ATTACHMENT_ACCEPT = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES].join(
  ","
);

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_ATTACHMENTS = 3;

export type AttachmentKind = "image" | "video";

export function kindForFile(file: File): AttachmentKind | null {
  if (IMAGE_MIME_TYPES.includes(file.type)) return "image";
  if (VIDEO_MIME_TYPES.includes(file.type)) return "video";
  return null;
}

const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

/** Returns an error message if the file isn't an allowed attachment, else null. */
export function validateAttachmentFile(file: File): string | null {
  const kind = kindForFile(file);
  if (!kind) {
    return "Only images (PNG, JPG, WEBP, GIF) and video (MP4, WebM, MOV) are allowed.";
  }
  const cap = kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  if (file.size > cap) {
    return `${kind === "image" ? "Images" : "Videos"} must be ${mb(cap)}MB or smaller.`;
  }
  return null;
}
