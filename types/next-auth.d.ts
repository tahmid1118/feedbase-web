import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      userId: string;
      accessToken: string;
    };
  }

  interface User {
    userId: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    image?: string | null;
  }
}

export {};
