import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.userId) {
    redirect("/login");
  }

  // A signed-in account with no workspace yet (just registered) must onboard
  // first — create or join a workspace before entering the dashboard.
  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

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
      <Toaster />
    </div>
  );
}
