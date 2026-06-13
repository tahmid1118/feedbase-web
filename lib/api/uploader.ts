/**
 * File uploader service.
 *
 * Uploads use multipart/form-data, so they bypass the JSON `apiClient` and
 * talk to the backend directly. Do not set Content-Type manually — the browser
 * sets the multipart boundary automatically when given a FormData body.
 */

import { ApiError } from "./client";
import type { UploadResult } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";
const UPLOAD_TIMEOUT_MS = 60000;

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

export const uploaderApi = { uploadImage };
