import { AUTH_REQUEST_TIMEOUT_MS } from "@/lib/auth/constants";
import { AuthApiError } from "@/lib/auth/errors";
import { getApiBaseUrl } from "@/lib/auth/server-config";

type ErrorPayload = {
  message?: string;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as ErrorPayload).message === "string"
  ) {
    return (payload as ErrorPayload).message ?? fallback;
  }

  return fallback;
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestJson<TResponse>(
  path: string,
  init: RequestInit
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new AuthApiError(
        extractErrorMessage(payload, "Authentication request failed."),
        response.status,
        payload
      );
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AuthApiError("Request timed out. Please try again.", 408);
    }

    throw new AuthApiError("Unable to reach authentication service.", 503);
  } finally {
    clearTimeout(timeoutId);
  }
}
