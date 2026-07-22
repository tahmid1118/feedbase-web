import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/auth/auth-service";
import {
  DEFAULT_LANGUAGE,
  FORGOT_PASSWORD_RATE_LIMIT,
} from "@/lib/auth/constants";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import type {
  AuthRouteErrorResponse,
  AuthRouteSuccessResponse,
} from "@/lib/auth/types";

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Request a password-reset link. Deliberately opaque: whatever happens
 * downstream (account exists or not, email sent or not), this returns the same
 * neutral success — the backend also never reveals existence. The only real
 * failure the caller sees is our own rate limit.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const isAllowed = consumeRateLimit(
    `forgot-password:${clientIp}`,
    FORGOT_PASSWORD_RATE_LIMIT.maxAttempts,
    FORGOT_PASSWORD_RATE_LIMIT.windowMs
  );

  if (!isAllowed) {
    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Too many requests. Please try again in a minute.",
      },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<AuthRouteErrorResponse>(
      { status: "error", message: "Invalid request payload." },
      { status: 400 }
    );
  }

  const parsed = forgotPasswordSchema.safeParse({
    ...((payload as Record<string, unknown>) ?? {}),
    lg: (payload as Record<string, unknown>)?.lg ?? DEFAULT_LANGUAGE,
  });

  // Even a malformed email returns the same neutral success — no signal.
  if (!parsed.success) {
    return NextResponse.json<AuthRouteSuccessResponse>(
      { status: "success", message: "If an account exists, a reset link is on its way." },
      { status: 200 }
    );
  }

  try {
    const response = await requestPasswordReset(parsed.data);
    return NextResponse.json<AuthRouteSuccessResponse>(
      {
        status: "success",
        message: response.message || "If an account exists, a reset link is on its way.",
      },
      { status: 200 }
    );
  } catch {
    // Never leak a backend/transport failure as a different outcome — the user
    // gets the same neutral confirmation.
    return NextResponse.json<AuthRouteSuccessResponse>(
      { status: "success", message: "If an account exists, a reset link is on its way." },
      { status: 200 }
    );
  }
}
