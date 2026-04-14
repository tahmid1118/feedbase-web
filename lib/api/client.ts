/**
 * Base API client for Feedbase backend
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";
const DEFAULT_LANGUAGE = "en";
const REQUEST_TIMEOUT_MS = 30000;

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

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || "Request failed",
        response.status,
        data
      );
    }

    return data;
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
      body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
    });
  },
  
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
    });
  },
  
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
    });
  },
  
  delete: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    const bodyData = body && typeof body === "object" ? body : {};
    return request<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
    });
  },
};
