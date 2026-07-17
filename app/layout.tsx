import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";

import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { getLanguage } from "@/lib/i18n/server";
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

// Seed the single AuthSessionProvider server-side so authenticated pages have
// the session/token on first paint — without it there's a loading gap where the
// dashboard fires token-less API calls (backend replies "Access denied"). Every
// route is already dynamic (auth/portal reads), so this costs no static rendering.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const lng = await getLanguage();

  return (
    <html
      lang={lng}
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <I18nProvider lng={lng}>
          <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
