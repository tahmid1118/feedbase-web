import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Sora } from "next/font/google";

import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

const fontSans = Sora({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontHeading = Fraunces({
  variable: "--font-brand-heading",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
