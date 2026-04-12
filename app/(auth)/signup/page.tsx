import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user?.userId) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
          Create account
        </p>
        <h1 className="font-heading text-3xl leading-tight text-[#1c0a0c] sm:text-4xl">
          Join Feedbase and collect product feedback with clarity.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#1c0a0c]/70">
          Build your team workspace in under a minute, then prioritize what users
          need most with a secure and scalable foundation.
        </p>
      </header>

      <SignupForm />
    </div>
  );
}
