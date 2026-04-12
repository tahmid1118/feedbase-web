import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.userId) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          Welcome back
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          Sign in and continue shipping better decisions.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          Access your feedback streams, roadmap boards, changelog pipeline, and
          notifications from one secure place.
        </p>
      </header>

      <LoginForm />
    </div>
  );
}
