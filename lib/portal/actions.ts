/**
 * Client-side portal mutations. Comment creation is open to guests (token
 * optional — the backend attributes it to the logged-in user when a Bearer
 * token is sent); edit/delete require a token and are owner-only server-side.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

export interface ActionResult {
  ok: boolean;
  message?: string;
  data?: { id?: number } | null;
}

async function request(
  path: string,
  method: string,
  token: string | undefined,
  body: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ lg: "en", ...body }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json?.message, data: json?.data };
  } catch {
    return { ok: false, message: "Unable to reach the server. Please try again." };
  }
}

const enc = encodeURIComponent;

export const portalActions = {
  createComment: (
    tenant: string,
    postId: number,
    payload: {
      body: string;
      parentCommentId?: number | null;
      submitterName?: string;
      submitterEmail?: string;
      guestId?: string;
    },
    token?: string
  ) => request(`/public/${enc(tenant)}/posts/${postId}/comments`, "POST", token, payload),

  editComment: (tenant: string, commentId: number, body: string, token: string) =>
    request(`/public/${enc(tenant)}/comments/${commentId}`, "PUT", token, { body }),

  deleteComment: (tenant: string, commentId: number, token: string) =>
    request(`/public/${enc(tenant)}/comments/${commentId}`, "DELETE", token, {}),

  editPost: (
    tenant: string,
    postId: number,
    data: { title: string; description: string; postType?: string },
    token: string
  ) => request(`/public/${enc(tenant)}/posts/${postId}`, "PUT", token, data),

  deletePost: (tenant: string, postId: number, token: string) =>
    request(`/public/${enc(tenant)}/posts/${postId}`, "DELETE", token, {}),
};
