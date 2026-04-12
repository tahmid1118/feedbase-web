import { NextResponse } from "next/server";

import { registerWithCredentials } from "@/lib/auth/auth-service";
import {
  DEFAULT_LANGUAGE,
  REGISTER_RATE_LIMIT,
} from "@/lib/auth/constants";
import { AuthApiError } from "@/lib/auth/errors";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { registerPayloadSchema } from "@/lib/auth/schemas";
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

function toSafeStatusCode(statusCode: number): number {
  return statusCode >= 400 && statusCode < 600 ? statusCode : 500;
}

export async function POST(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const isAllowed = consumeRateLimit(
    `register:${clientIp}`,
    REGISTER_RATE_LIMIT.maxAttempts,
    REGISTER_RATE_LIMIT.windowMs
  );

  if (!isAllowed) {
    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Too many signup attempts. Please try again in a minute.",
      },
      { status: 429 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Invalid request payload.",
      },
      { status: 400 }
    );
  }

  const parsedPayload = registerPayloadSchema.safeParse({
    ...((payload as Record<string, unknown>) ?? {}),
    lg: (payload as Record<string, unknown>)?.lg ?? DEFAULT_LANGUAGE,
  });

  if (!parsedPayload.success) {
    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Please fix the highlighted fields and try again.",
        fieldErrors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const response = await registerWithCredentials(parsedPayload.data);

    return NextResponse.json<AuthRouteSuccessResponse>(
      {
        status: "success",
        message: response.message || "Sign up is successful",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthApiError) {
      const statusCode = toSafeStatusCode(error.statusCode);

      return NextResponse.json<AuthRouteErrorResponse>(
        {
          status: "error",
          message:
            statusCode >= 500
              ? "Unable to create account right now. Please try again."
              : error.message,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Unable to create account right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
