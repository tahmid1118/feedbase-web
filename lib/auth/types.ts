export interface ApiMessageResponse {
  status: string;
  message: string;
}

export interface LoginCredentialsInput {
  email: string;
  password: string;
  lg: string;
  /** Owner-confirmed takeover after a 409: sign out other devices, then log in. */
  force?: boolean;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  contact: string;
  password: string;
  lg: string;
}

export interface LoginApiRequest {
  lg: string;
  userData: {
    email: string;
    password: string;
    force?: boolean;
  };
}

export interface LoginApiUser {
  token: string;
  id: string | number;
  tenantId?: string | number | null;
  role?: string | null;
  fullName: string;
  email: string;
  imageUrl?: string | null;
  isPlatformAdmin?: boolean;
}

export interface LoginApiResponse extends ApiMessageResponse {
  user?: LoginApiUser;
}

/**
 * Social sign-in. NextAuth has already verified the provider's ID token, so what
 * we forward is an assertion the backend trusts — which is why `emailVerified`
 * is part of the contract and not optional: the backend refuses to match an
 * account by an unverified address.
 */
export interface OAuthLoginApiRequest {
  lg: string;
  userData: {
    provider: "google";
    providerUserId: string;
    email: string;
    emailVerified: boolean;
    fullName?: string;
    avatarUrl?: string;
    force?: boolean;
  };
}

export interface OAuthLoginInput {
  provider: "google";
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  fullName?: string;
  avatarUrl?: string;
  force?: boolean;
  lg?: string;
}

export interface AdminLoginApiResponse extends ApiMessageResponse {
  admin?: {
    token: string;
    id: string | number;
    email: string;
    fullName: string;
    imageUrl?: string | null;
  };
}

export interface RegisterApiRequest {
  lg: string;
  userData: {
    fullName: string;
    email: string;
    contact: string;
    password: string;
  };
}

export type RegisterApiResponse = ApiMessageResponse;

export interface SessionUserProfile {
  id: string;
  userId: string;
  tenantId: string | null;
  role: string | null;
  name: string;
  email: string;
  image: string | null;
  accessToken: string;
  // True when signed in through the admin door (admin session).
  isAdmin?: boolean;
  adminId?: string | null;
  // True when the ACCOUNT holds the platform-admin role — carried on the normal
  // user session too, so the portal can offer the admin an anonymous-mode toggle.
  isPlatformAdmin?: boolean;
}

export interface AuthRouteErrorResponse {
  status: "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface AuthRouteSuccessResponse {
  status: "success";
  message: string;
}
