import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export default async function AdminLoginPage() {
  const session = await auth();

  // Already an admin? Go to the panel. (A tenant session stays put — they can
  // still sign in here as an admin with the same or a different email.)
  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          Platform administration
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          Admin sign in
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          Manage every workspace, user, subscription, and promo code from the
          admin panel. This is separate from a normal Feedbase account.
        </p>
      </header>

      <AdminLoginForm />
    </div>
  );
}
