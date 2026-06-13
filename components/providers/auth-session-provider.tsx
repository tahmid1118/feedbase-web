"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface AuthSessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthSessionProvider({
  children,
  session,
}: AuthSessionProviderProps): React.ReactNode {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
