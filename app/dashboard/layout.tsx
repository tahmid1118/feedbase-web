import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AdminReturnBanner } from "@/components/dashboard/admin-return-banner";
import { SingleTabGuard } from "@/components/dashboard/single-tab-guard";
import { SupportChatWidget } from "@/components/support/support-chat-widget";
import { Toaster } from "@/components/ui/sonner";
import { billingApi } from "@/lib/api";

// `absolute` stops the root layout's marketing title template ("%s —
// FeedBoard", added for the root site's own SEO — CLAUDE.md's SEO section)
// from reaching authenticated pages, none of which set their own title. Not
// an SEO concern (auth-gated, disallowed in robots.txt) — this is purely so a
// logged-in user's browser tab reads "FeedBoard", not the full marketing
// tagline, matching how it read before that template was added.
export const metadata: Metadata = {
  title: { absolute: "FeedBoard" },
};

/**
 * May this workspace run in several tabs/devices at once? Business only.
 * Fails OPEN: if billing can't be read we let the user work rather than block a
 * paying customer over a transient error — the hard limit (one login at a time)
 * is enforced on the backend regardless.
 */
async function allowsMultiDevice(token: string): Promise<boolean> {
  try {
    const status = await billingApi.getStatus(token);
    return status.data?.limits?.multiDevice !== false;
  } catch {
    return true;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.userId) {
    redirect("/login");
  }

  // A platform admin has no tenant identity — send them to the admin panel
  // rather than tenant onboarding.
  if (session.user.isAdmin) {
    redirect("/admin");
  }

  // A signed-in account with no workspace yet (just registered) must onboard
  // first — create or join a workspace before entering the dashboard.
  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  const multiDevice = await allowsMultiDevice(session.user.accessToken);

  // Note: the session context comes from the root <AuthSessionProvider>. We do
  // NOT add a second SessionProvider here — nesting them breaks `update()`, so
  // profile changes (e.g. avatar) would never reach the header.
  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <Sidebar />
      <Header user={session.user} />
      {/* No left margin on phones — the rail is a drawer there. `min-w-0`
          prevents a wide child (a table, a long word) from stretching the shell
          and making the whole page scroll sideways. */}
      <main className="min-w-0 pt-16 md:ml-64">
        <AdminReturnBanner />
        <div className="p-4 sm:p-6">{children}</div>
      </main>
      {/* A 2nd tab reuses the session cookie, so only the browser can catch it. */}
      <SingleTabGuard multiDevice={multiDevice} />
      {/* Contact support — available to every role/plan on all dashboard pages. */}
      <SupportChatWidget />
      <Toaster />
    </div>
  );
}
