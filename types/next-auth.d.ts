import { DefaultSession } from "next-auth";

/**
 * A snapshot of the platform-admin identity, stashed on the session while an
 * admin is "in" a workspace's dashboard via the Open-in-dashboard handoff. It
 * lets the dashboard restore the admin session in one click (no re-login) — the
 * admin never actually leaves; they just borrow a tenant identity meanwhile.
 */
export interface SavedAdminIdentity {
  accessToken: string;
  adminId: string | null;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      userId: string;
      tenantId: string | null;
      role: string | null;
      accessToken: string;
      isAdmin?: boolean;
      adminId?: string | null;
      savedAdmin?: SavedAdminIdentity | null;
    };
  }

  interface User {
    userId: string;
    tenantId: string | null;
    role: string | null;
    accessToken: string;
    isAdmin?: boolean;
    adminId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    tenantId?: string | null;
    role?: string | null;
    accessToken?: string;
    image?: string | null;
    isAdmin?: boolean;
    adminId?: string | null;
    savedAdmin?: SavedAdminIdentity | null;
  }
}

export {};
