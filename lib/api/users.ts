/**
 * Users API service
 */

import { apiClient } from "./client";
import type {
  AccountDeletionSummary,
  ApiResponse,
  PersonalData,
  UpdateProfileData,
  OAuthLoginData,
  User,
  UserRole,
  PaginationData,
  PaginatedResponse,
  Workspace,
  WorkspaceAuth,
} from "./types";

export const usersApi = {
  /**
   * Exchange a verified OAuth identity for a Feedbase JWT. The provider
   * handshake happens on the frontend; this posts the resulting identity.
   * Public endpoint — no bearer token required.
   */
  oauthLogin: (data: OAuthLoginData) =>
    apiClient.post<ApiResponse & { user?: Record<string, unknown> }>(
      "/users/oauth/login",
      { userData: data },
      { skipAuth: true }
    ),

  /**
   * GET endpoint. The browser fetch spec forbids a body on GET, so we send
   * none — the backend defaults `lg` for this route.
   */
  getPersonalData: (token: string) =>
    apiClient.get<ApiResponse<PersonalData>>("/users/personal-data", { token }),

  updateProfile: (data: UpdateProfileData, token: string) =>
    apiClient.post<ApiResponse>("/users/update", { userData: data }, { token }),

  changePassword: (oldPassword: string, newPassword: string, token: string) =>
    apiClient.post<ApiResponse>(
      "/users/change-password",
      { oldPassword, newPassword },
      { token }
    ),

  updateRole: (userId: number, role: UserRole, token: string) =>
    apiClient.patch<ApiResponse>(`/users/role/${userId}`, { role }, { token }),

  list: (token: string) =>
    apiClient.post<ApiResponse<User[]>>("/users/user-list", { lg: "en" }, { token }),

  tableData: (pagination: PaginationData, token: string) =>
    apiClient.post<ApiResponse<PaginatedResponse<User>>>(
      "/users/table-data",
      { paginationData: pagination },
      { token }
    ),

  // --- Workspaces (multi-tenant per account) ---
  getWorkspaces: (token: string) =>
    apiClient.get<ApiResponse<{ workspaces: Workspace[] }>>(
      "/users/workspaces?lg=en",
      { token }
    ),

  checkSubdomain: (subdomain: string, token: string) =>
    apiClient.get<ApiResponse<{ valid: boolean; available: boolean }>>(
      `/users/workspaces/check-subdomain?lg=en&subdomain=${encodeURIComponent(subdomain)}`,
      { token }
    ),

  createWorkspace: (
    data: { name: string; subdomain: string; website?: string },
    token: string
  ) =>
    apiClient.post<ApiResponse<WorkspaceAuth>>(
      "/users/workspaces/create",
      { workspaceData: data },
      { token }
    ),

  switchWorkspace: (tenantId: number, token: string) =>
    apiClient.post<ApiResponse<WorkspaceAuth>>(
      "/users/workspaces/switch",
      { tenantId },
      { token }
    ),

  /**
   * End this device's session server-side. Must be called on sign-out: on
   * single-device plans the session is what blocks the next login, so skipping
   * this would lock the user out until the session went idle.
   */
  logout: (token: string) =>
    apiClient.post<ApiResponse<null>>("/users/logout", {}, { token }),

  // --- Account deletion ---
  /** What deleting this account would destroy (for the confirmation dialog). */
  getDeletionSummary: (token: string) =>
    apiClient.post<ApiResponse<AccountDeletionSummary>>(
      "/users/account/deletion-summary",
      {},
      { token }
    ),

  /** Permanently delete the account. Owned workspaces go with it. */
  deleteAccount: (password: string, token: string) =>
    apiClient.post<ApiResponse<{ deletedWorkspaces: number; leftWorkspaces: number }>>(
      "/users/account/delete",
      { password },
      { token }
    ),
};
