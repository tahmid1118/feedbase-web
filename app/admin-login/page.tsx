import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { Logo } from "@/components/ui/logo";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata = {
  title: "Admin sign in · Feedbase",
};

export default async function AdminLoginPage() {
  const session = await auth();

  // Already an admin? Straight to the panel.
  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(150deg,#1c0a0c_0%,#5a2028_55%,#7a2d38_100%)] px-4 py-10 text-[#fdf8f9]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(199,73,89,0.35),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf8f9]/12 ring-1 ring-[#fdf8f9]/20">
            <Logo className="h-7 w-7" />
          </span>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf8f9]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
        </div>

        <div className="rounded-3xl border border-[#fdf8f9]/15 bg-white p-8 text-[#1c0a0c] shadow-[0_36px_90px_-45px_rgba(0,0,0,0.8)]">
          <header className="mb-6 space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-[#1c0a0c]">
              Platform administration
            </h1>
            <p className="text-sm text-[#1c0a0c]/60">
              Sign in to manage all workspaces, users, subscriptions, and promo
              codes. This is separate from a normal Feedbase account.
            </p>
          </header>

          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[#fdf8f9]/60">
          Not an admin?{" "}
          <a href="/login" className="font-semibold text-[#fdf8f9] underline">
            Go to the app sign in
          </a>
        </p>
      </div>
    </div>
  );
}
