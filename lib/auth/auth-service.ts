import { requestJson } from "@/lib/auth/api-client";
import { AuthApiError } from "@/lib/auth/errors";
import type {
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
    name: response.user.fullName,
    email: response.user.email,
    image: response.user.imageUrl ?? null,
    accessToken: response.user.token,
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
