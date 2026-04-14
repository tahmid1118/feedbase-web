import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SessionProvider } from "@/components/providers/session-provider";
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

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-[#fdf8f9]">
        <Sidebar />
        <Header user={session.user} />
        <main className="ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
        <Toaster />
      </div>
    </SessionProvider>
  );
}
