const FALLBACK_API_BASE_URL = "http://localhost:4560";

export function getApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.FEEDBASE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    FALLBACK_API_BASE_URL;

  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}
