import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SingleTabGuard } from "@/components/dashboard/single-tab-guard";
import { Toaster } from "@/components/ui/sonner";
import { billingApi } from "@/lib/api";

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
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
      {/* A 2nd tab reuses the session cookie, so only the browser can catch it. */}
      <SingleTabGuard multiDevice={multiDevice} />
      <Toaster />
    </div>
  );
}
