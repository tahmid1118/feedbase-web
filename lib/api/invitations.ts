/**
 * Workspace invitation API (owner-only management + accepting an invite).
 */
import { apiClient } from "./client";
import type { ApiResponse, WorkspaceAuth } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

/**
 * Accept an invitation as a NEW user (unauthenticated — the emailed link is the
 * proof of email ownership). Creates the account + workspace membership and
 * returns the workspace they joined.
 */
export async function acceptInvitationAsNewUser(
  inviteToken: string,
  data: { fullName: string; password: string }
): Promise<{ ok: boolean; message?: string; data?: WorkspaceAuth }> {
  try {
    const res = await fetch(
      `${API_BASE}/public/invitations/${encodeURIComponent(inviteToken)}/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lg: "en", ...data }),
      }
    );
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json?.message, data: json?.data };
  } catch {
    return { ok: false, message: "Unable to reach the server. Please try again." };
  }
}

export interface Invitation {
  id: number;
  email: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  created_at: string;
  is_expired: number;
}

export interface InvitationSent {
  id: number;
  email: string;
  expiresAt: string;
  /** False when no mail provider is configured (the link is logged instead). */
  emailSent: boolean;
  mailConfigured: boolean;
}

export const invitationsApi = {
  /** Invite someone to the current workspace by email (owner only). */
  create: (email: string, token: string) =>
    apiClient.post<ApiResponse<InvitationSent>>("/invitations", { email }, { token }),

  /** Outstanding invitations for the current workspace. */
  list: (token: string) =>
    apiClient.post<ApiResponse<{ rows: Invitation[] }>>(
      "/invitations/list",
      {},
      { token }
    ),

  /** Revoke a pending invitation — its link stops working immediately. */
  revoke: (id: number, token: string) =>
    // NB: delete(endpoint, body, options) — the token is an OPTION, not the body.
    apiClient.delete<ApiResponse>(`/invitations/${id}`, {}, { token }),

  /**
   * Accept an invitation as an already-registered, signed-in account. The
   * session email must match the invited email (server-enforced). Returns fresh
   * auth scoped to the invited workspace.
   */
  acceptAsExistingUser: (inviteToken: string, token: string) =>
    apiClient.post<ApiResponse<WorkspaceAuth>>(
      `/invitations/${inviteToken}/accept`,
      {},
      { token }
    ),
};
