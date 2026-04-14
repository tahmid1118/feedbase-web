/**
 * API health check utility
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

export async function checkApiHealth(): Promise<{
  isHealthy: boolean;
  message: string;
  url: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    return {
      isHealthy: response.ok,
      message: response.ok ? "API is healthy" : `API returned status ${response.status}`,
      url: API_BASE_URL,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        isHealthy: false,
        message: "API health check timed out",
        url: API_BASE_URL,
      };
    }

    return {
      isHealthy: false,
      message: `Cannot connect to API at ${API_BASE_URL}. Please ensure the backend is running.`,
      url: API_BASE_URL,
    };
  }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
