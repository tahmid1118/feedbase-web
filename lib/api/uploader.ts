/**
 * File uploader service.
 *
 * Uploads use multipart/form-data, so they bypass the JSON `apiClient` and
 * talk to the backend directly. Do not set Content-Type manually — the browser
 * sets the multipart boundary automatically when given a FormData body.
 */

import { ApiError } from "./client";
import type { UploadResult, PostAttachment } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";
const UPLOAD_TIMEOUT_MS = 60000;
// Videos are larger than avatars and slower to upload — give them room.
const ATTACHMENT_TIMEOUT_MS = 180000;

export async function uploadImage(
  file: File,
  token: string
): Promise<UploadResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("upload_image", file);
    formData.append("lg", "en");

    const response = await fetch(`${API_BASE_URL}/uploader/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || "Upload failed", response.status, data);
    }

    return data as UploadResult;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Upload timed out", 408);
    }

    throw new ApiError(
      "Unable to upload image. Please ensure the backend is running on port 4560.",
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** A freshly-uploaded attachment (server assigns the id used to link it). */
export type UploadedAttachment = Pick<
  PostAttachment,
  "id" | "kind" | "url" | "mime_type" | "size_bytes"
>;

/**
 * Upload one photo/video attachment for a feedback post from the DASHBOARD
 * (authenticated). Returns the stored attachment incl. its id; pass the ids to
 * postsApi.create as `attachmentIds` to link them. Throws ApiError(402) if the
 * workspace plan doesn't allow attachments.
 */
export async function uploadAttachment(
  file: File,
  token: string
): Promise<UploadedAttachment> {
  return postAttachment(`${API_BASE_URL}/posts/attachment`, file, {
    Authorization: `Bearer ${token}`,
  });
}

/**
 * Upload one attachment for a PUBLIC portal feedback submission (unauthenticated
 * — the submitter is usually a guest). Tenant-scoped + plan-gated server-side.
 */
export async function uploadPublicAttachment(
  file: File,
  tenant: string
): Promise<UploadedAttachment> {
  return postAttachment(
    `${API_BASE_URL}/public/${encodeURIComponent(tenant)}/attachments`,
    file
  );
}

/** Shared multipart POST for both attachment endpoints. */
async function postAttachment(
  url: string,
  file: File,
  headers: Record<string, string> = {}
): Promise<UploadedAttachment> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ATTACHMENT_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lg", "en");

    const response = await fetch(url, {
      method: "POST",
      headers, // no Content-Type — the browser sets the multipart boundary
      body: formData,
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(data.message || "Upload failed", response.status, data);
    }
    return data.data as UploadedAttachment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Upload timed out — the file may be too large.", 408);
    }
    throw new ApiError("Unable to upload the attachment.", 503);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const uploaderApi = {
  uploadImage,
  uploadAttachment,
  uploadPublicAttachment,
};
