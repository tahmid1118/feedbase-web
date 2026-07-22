import { NextResponse } from "next/server";

import { submitPasswordReset } from "@/lib/auth/auth-service";
import { DEFAULT_LANGUAGE } from "@/lib/auth/constants";
import { AuthApiError } from "@/lib/auth/errors";
import { resetPayloadSchema } from "@/lib/auth/schemas";
import type {
  AuthRouteErrorResponse,
  AuthRouteSuccessResponse,
} from "@/lib/auth/types";

function toSafeStatusCode(statusCode: number): number {
  return statusCode >= 400 && statusCode < 600 ? statusCode : 500;
}

/** Consume a reset token and set the new password. */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<AuthRouteErrorResponse>(
      { status: "error", message: "Invalid request payload." },
      { status: 400 }
    );
  }

  const parsed = resetPayloadSchema.safeParse({
    ...((payload as Record<string, unknown>) ?? {}),
    lg: (payload as Record<string, unknown>)?.lg ?? DEFAULT_LANGUAGE,
  });

  if (!parsed.success) {
    return NextResponse.json<AuthRouteErrorResponse>(
      {
        status: "error",
        message: "Please choose a valid password and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const response = await submitPasswordReset(parsed.data);
    return NextResponse.json<AuthRouteSuccessResponse>(
      { status: "success", message: response.message || "Your password has been reset." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthApiError) {
      const statusCode = toSafeStatusCode(error.statusCode);
      return NextResponse.json<AuthRouteErrorResponse>(
        {
          status: "error",
          message:
            statusCode >= 500
              ? "Unable to reset your password right now. Please try again."
              : error.message,
        },
        { status: statusCode }
      );
    }
    return NextResponse.json<AuthRouteErrorResponse>(
      { status: "error", message: "Unable to reset your password right now. Please try again." },
      { status: 500 }
    );
  }
}
