import { LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.userId) {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fdf8f9] px-4 py-8 text-[#1c0a0c] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(227,153,163,0.35),transparent_42%),radial-gradient(circle_at_85%_92%,rgba(199,73,89,0.2),transparent_40%)]" />

      <main className="auth-reveal relative w-full max-w-3xl rounded-[1.75rem] border border-[#e399a3]/55 bg-white/80 p-6 shadow-[0_28px_80px_-42px_rgba(28,10,12,0.6)] backdrop-blur-xl sm:p-10">
        <div className="space-y-7">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c74959]">
                Workspace Ready
              </p>
              <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
                Welcome, {session.user.name || "Feedbase user"}
              </h1>
              <p className="text-sm leading-relaxed text-[#1c0a0c]/72">
                Authentication is now active with secure credentials flow and protected
                sessions.
              </p>
            </div>

            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="outline"
                className="h-10 border-[#c74959]/40 bg-[#fdf8f9] px-4 text-[#8f2f3b] hover:bg-[#c74959]/10 hover:text-[#7a2834]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e399a3]/55 bg-[#fdf8f9] p-4">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#c74959]/12 text-[#c74959]">
                <UserRound className="h-4 w-4" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#1c0a0c]/55">User ID</p>
              <p className="mt-1 font-mono text-sm text-[#1c0a0c]">{session.user.userId}</p>
            </div>

            <div className="rounded-2xl border border-[#e399a3]/55 bg-[#fdf8f9] p-4">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#da6a78]/15 text-[#c74959]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#1c0a0c]/55">Session</p>
              <p className="mt-1 text-sm font-semibold text-[#1c0a0c]">Authenticated</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e399a3]/55 bg-[linear-gradient(135deg,rgba(253,248,249,0.92),rgba(227,153,163,0.24))] p-4 text-sm leading-relaxed text-[#1c0a0c]/78">
            <p className="inline-flex items-center gap-2 font-semibold text-[#8f2f3b]">
              <Sparkles className="h-4 w-4" />
              Next step
            </p>
            <p className="mt-1">
              Connect your protected dashboard routes and API calls to
              <span className="font-semibold"> session.user.accessToken</span> for
              authenticated operations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
