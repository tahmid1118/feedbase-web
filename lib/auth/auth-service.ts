import { requestJson } from "@/lib/auth/api-client";
import { AuthApiError } from "@/lib/auth/errors";
import { resolveAvatarUrl } from "@/lib/avatar";
import type {
  AdminLoginApiResponse,
  LoginApiRequest,
  LoginApiResponse,
  LoginCredentialsInput,
  RegisterApiRequest,
  RegisterApiResponse,
  RegisterInput,
  SessionUserProfile,
} from "@/lib/auth/types";

function isSuccess(status: string): boolean {
  return status.toLowerCase() === "success";
}

export async function loginWithCredentials(
  input: LoginCredentialsInput
): Promise<SessionUserProfile | null> {
  const payload: LoginApiRequest = {
    lg: input.lg,
    userData: {
      email: input.email,
      password: input.password,
      ...(input.force ? { force: true } : {}),
    },
  };

  const response = await requestJson<LoginApiResponse>("/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!isSuccess(response.status) || !response.user?.token) {
    return null;
  }

  const userId = String(response.user.id);

  return {
    id: userId,
    userId,
    tenantId:
      response.user.tenantId != null ? String(response.user.tenantId) : null,
    role: response.user.role ?? null,
    name: response.user.fullName,
    email: response.user.email,
    image: resolveAvatarUrl(response.user.imageUrl) ?? null,
    accessToken: response.user.token,
  };
}

export async function loginAsAdmin(
  input: LoginCredentialsInput
): Promise<SessionUserProfile | null> {
  const payload: LoginApiRequest = {
    lg: input.lg,
    userData: { email: input.email, password: input.password },
  };

  const response = await requestJson<AdminLoginApiResponse>(
    "/admin/auth/login",
    { method: "POST", body: JSON.stringify(payload) }
  );

  if (!isSuccess(response.status) || !response.admin?.token) {
    return null;
  }

  const adminId = String(response.admin.id);

  // A platform admin has no tenant identity: tenantId/role are null and the
  // `isAdmin` flag routes them to the admin panel instead of the dashboard.
  return {
    id: adminId,
    userId: adminId,
    tenantId: null,
    role: null,
    name: response.admin.fullName,
    email: response.admin.email,
    image: resolveAvatarUrl(response.admin.imageUrl) ?? null,
    accessToken: response.admin.token,
    isAdmin: true,
    adminId,
  };
}

export async function registerWithCredentials(
  input: RegisterInput
): Promise<RegisterApiResponse> {
  const payload: RegisterApiRequest = {
    lg: input.lg,
    userData: {
      fullName: input.fullName,
      email: input.email,
      contact: input.contact,
      password: input.password,
    },
  };

  const response = await requestJson<RegisterApiResponse>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!isSuccess(response.status)) {
    throw new AuthApiError(response.message || "Sign up failed.", 400, response);
  }

  return response;
}

type MessageResponse = { status: string; message: string };

/**
 * Ask for a password-reset link. The backend never reveals whether the email
 * exists, so this resolves for any input; the caller shows a neutral message.
 */
export async function requestPasswordReset(input: {
  email: string;
  lg: string;
}): Promise<MessageResponse> {
  return requestJson<MessageResponse>("/users/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email: input.email, lg: input.lg }),
  });
}

/**
 * Consume a reset token and set a new password. Throws AuthApiError on an
 * invalid/expired token or a weak password (surfaced by requestJson on non-2xx).
 */
export async function submitPasswordReset(input: {
  token: string;
  password: string;
  lg: string;
}): Promise<MessageResponse> {
  const response = await requestJson<MessageResponse>("/users/password/reset", {
    method: "POST",
    body: JSON.stringify({
      token: input.token,
      password: input.password,
      lg: input.lg,
    }),
  });

  if (!isSuccess(response.status)) {
    throw new AuthApiError(response.message || "Password reset failed.", 400, response);
  }

  return response;
}
