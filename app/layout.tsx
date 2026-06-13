import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";

import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

const fontSans = Sora({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-brand-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feedbase",
  description: "Collect, prioritize, and ship product feedback with confidence.",
};

// Kept synchronous (no `await auth()`) so public routes stay statically
// renderable. The session is resolved client-side by AuthSessionProvider, and
// the dashboard layout passes the server session straight to the header.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
