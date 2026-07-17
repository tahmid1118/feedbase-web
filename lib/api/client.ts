/**
 * Base API client for Feedbase backend
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";
const DEFAULT_LANGUAGE = "en";
const REQUEST_TIMEOUT_MS = 30000;

/**
 * The language to send as `lg` on each request — the user's selected UI language
 * so the backend replies with localized messages. Read from the `i18next` cookie
 * (set by the navbar language selector); falls back to English on the server or
 * before a choice is made.
 */
function currentLanguage(): string {
  if (typeof document === "undefined") return DEFAULT_LANGUAGE;
  const m = document.cookie.match(/(?:^|;\s*)i18next=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : DEFAULT_LANGUAGE;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/**
 * The backend answers 401 "Session ended" when the device session behind a token
 * is gone — signed out here, or (on one-device plans) taken over by a login on
 * another device after this one went idle. The cookie would otherwise survive
 * and leave the user staring at a dashboard where every request fails, so we
 * sign them out and send them to the login page with an explanation.
 *
 * Fires once per page: a dashboard screen makes several parallel calls and they
 * would all trip this.
 */
let sessionEndedHandled = false;

function handleSessionEnded() {
  if (sessionEndedHandled || typeof window === "undefined") return;
  sessionEndedHandled = true;
  // Imported lazily so this module stays usable on the server.
  import("next-auth/react")
    .then(({ signOut }) =>
      signOut({ callbackUrl: "/login?reason=session_ended" })
    )
    .catch(() => window.location.assign("/login?reason=session_ended"));
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add custom headers from options
    if (fetchOptions.headers) {
      const customHeaders = fetchOptions.headers as Record<string, string>;
      Object.assign(headers, customHeaders);
    }

    if (token && !skipAuth) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    // Read as text first: some error responses (e.g. the auth middleware's
    // plain "Access denied") aren't JSON, and feeding those to response.json()
    // throws a SyntaxError that would be mistaken for a connection failure.
    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      // Not for /users/logout — that call *is* the sign-out, and a 401 there
      // just means the session was already gone.
      if (response.status === 401 && endpoint !== "/users/logout") {
        handleSessionEnded();
      }

      const message =
        data && typeof data === "object" && "message" in data
          ? String((data as { message?: unknown }).message)
          : "";
      throw new ApiError(
        message || `Request failed (${response.status})`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }

    // Log detailed error for debugging
    console.error("API Request Error:", {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      url: `${API_BASE_URL}${endpoint}`,
    });

    throw new ApiError(
      "Unable to connect to the API. Please ensure the backend is running on port 4560.",
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify({ lg: currentLanguage(), ...bodyData }),
    });
  },
  
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify({ lg: currentLanguage(), ...bodyData }),
    });
  },
  
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify({ lg: currentLanguage(), ...bodyData }),
    });
  },
  
  delete: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: JSON.stringify({ lg: currentLanguage(), ...bodyData }),
    });
  },
};
