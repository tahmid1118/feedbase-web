export interface ApiMessageResponse {
  status: string;
  message: string;
}

export interface LoginCredentialsInput {
  email: string;
  password: string;
  lg: string;
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
  };
}

export interface LoginApiUser {
  token: string;
  id: string | number;
  fullName: string;
  email: string;
  imageUrl?: string | null;
}

export interface LoginApiResponse extends ApiMessageResponse {
  user?: LoginApiUser;
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
  name: string;
  email: string;
  image: string | null;
  accessToken: string;
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
