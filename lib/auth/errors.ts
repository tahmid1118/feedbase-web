export class AuthApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
