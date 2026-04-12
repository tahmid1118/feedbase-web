"use client";

import { SessionProvider } from "next-auth/react";

interface AuthSessionProviderProps {
  children: React.ReactNode;
}

export function AuthSessionProvider({
  children,
}: AuthSessionProviderProps): React.ReactNode {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
