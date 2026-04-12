export const DEFAULT_LANGUAGE = "en";

export const AUTH_REQUEST_TIMEOUT_MS = 10_000;

export const LOGIN_RATE_LIMIT = {
  maxAttempts: 8,
  windowMs: 60_000,
} as const;

export const REGISTER_RATE_LIMIT = {
  maxAttempts: 6,
  windowMs: 60_000,
} as const;
