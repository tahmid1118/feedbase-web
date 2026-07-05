import { DefaultSession } from "next-auth";

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
  }
}

export {};
