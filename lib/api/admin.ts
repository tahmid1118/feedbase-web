/**
 * Admin Panel API client. Talks to the backend `/admin/*` routes using the
 * platform-admin access token (from the isAdmin session). Kept separate from the
 * tenant `apiClient` because these are true REST GET/PUT/DELETE endpoints.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

export interface AdminResult<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

async function request<T = unknown>(
  path: string,
  method: string,
  token: string | undefined,
  body?: Record<string, unknown>
): Promise<AdminResult<T>> {
  try {
    const res = await fetch(`${API_BASE}/admin${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        method === "GET" ? undefined : JSON.stringify({ lg: "en", ...(body || {}) }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: json?.message, data: json?.data as T };
  } catch {
    return { ok: false, message: "Unable to reach the server." };
  }
}

const qs = (search?: string) =>
  search ? `?search=${encodeURIComponent(search)}` : "";

export interface OverviewData {
  tenants: number;
  active_tenants: number;
  users: number;
  posts: number;
  paid_subs: number;
  redemptions: number;
  plan_breakdown: { plan_name: string; n: number }[];
}

export interface AdminWorkspace {
  id: number;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  plan_name: string;
  subscription_status: string | null;
  is_active: number;
  created_at: string;
  owner_email: string | null;
  user_count: number;
  post_count: number;
}

export interface AdminUserRow {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  is_active: number;
  tenant_id: number | null;
  created_at: string;
  last_login_at: string | null;
  workspace_name: string | null;
}

export interface AdminRow {
  id: number;
  email: string;
  full_name: string;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
}

export const adminApi = {
  overview: (token?: string) =>
    request<OverviewData>("/overview", "GET", token),

  // Workspaces
  listWorkspaces: (token?: string, search?: string) =>
    request<{ rows: AdminWorkspace[] }>(`/workspaces${qs(search)}`, "GET", token),
  getWorkspace: (token: string | undefined, id: number) =>
    request(`/workspaces/${id}`, "GET", token),
  updateWorkspace: (
    token: string | undefined,
    id: number,
    data: { name?: string; isActive?: boolean }
  ) => request(`/workspaces/${id}`, "PUT", token, data),
  setWorkspacePlan: (token: string | undefined, id: number, plan: string) =>
    request(`/workspaces/${id}/plan`, "PUT", token, { plan }),
  deleteWorkspace: (token: string | undefined, id: number) =>
    request(`/workspaces/${id}`, "DELETE", token),

  // Users
  listUsers: (token?: string, search?: string) =>
    request<{ rows: AdminUserRow[] }>(`/users${qs(search)}`, "GET", token),
  updateUser: (
    token: string | undefined,
    id: number,
    data: { fullName?: string; role?: string; isActive?: boolean }
  ) => request(`/users/${id}`, "PUT", token, data),
  resetUserPassword: (token: string | undefined, id: number, password: string) =>
    request(`/users/${id}/password`, "PUT", token, { password }),
  deleteUser: (token: string | undefined, id: number) =>
    request(`/users/${id}`, "DELETE", token),

  // Admins
  listAdmins: (token?: string) =>
    request<{ rows: AdminRow[] }>("/admins", "GET", token),
  createAdmin: (
    token: string | undefined,
    data: { email: string; fullName: string; password: string }
  ) => request("/admins", "POST", token, data),
  setAdminActive: (token: string | undefined, id: number, isActive: boolean) =>
    request(`/admins/${id}/active`, "PUT", token, { isActive }),
  deleteAdmin: (token: string | undefined, id: number) =>
    request(`/admins/${id}`, "DELETE", token),
};
