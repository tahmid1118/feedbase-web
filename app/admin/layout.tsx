import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only platform admins may enter the panel.
  if (!session?.user?.isAdmin) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <AdminSidebar />
      <AdminHeader name={session.user.name} email={session.user.email} />
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
