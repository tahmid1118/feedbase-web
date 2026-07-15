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
}

export interface LoginApiResponse extends ApiMessageResponse {
  user?: LoginApiUser;
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
  // Platform operator (admins table). Absent/false for ordinary tenant users.
  isAdmin?: boolean;
  adminId?: string | null;
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
