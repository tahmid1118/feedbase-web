import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

const highlights = [
  {
    id: "security",
    icon: ShieldCheck,
    title: "Centralize feedback",
    description:
      "Collect feature requests, bug reports, and ideas in one organized space your team can access anytime.",
  },
  {
    id: "speed",
    icon: Zap,
    title: "Prioritize with votes",
    description:
      "Let your users vote on what matters most, so you build features that drive real impact.",
  },
  {
    id: "insight",
    icon: Sparkles,
    title: "Share your roadmap",
    description:
      "Keep customers engaged with a public roadmap and changelog that shows you're listening.",
  },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdf8f9] text-[#1c0a0c]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(227,153,163,0.08),transparent_70%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#e399a3]/50 bg-white/80 shadow-[0_36px_90px_-45px_rgba(28,10,12,0.65)] backdrop-blur-xl lg:grid-cols-2">
          <aside className="relative hidden flex-col justify-between bg-[linear-gradient(145deg,#1c0a0c_0%,#7a2d38_45%,#c74959_100%)] p-10 text-[#fdf8f9] lg:flex">
            <div className="space-y-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm tracking-[0.22em]">
                FEEDBASE
              </Link>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.28em] text-[#fdf8f9]/75">
                  Product Feedback Platform
                </p>
                <h2 className="font-heading text-4xl leading-tight">
                  Turn user feedback into your competitive advantage.
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-[#fdf8f9]/85">
                  Join thousands of product teams who use Feedbase to understand what their customers really want and build products that win.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-[#fdf8f9]/20 bg-[#fdf8f9]/10 p-5 backdrop-blur-sm">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf8f9]/18">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="text-xs leading-relaxed text-[#fdf8f9]/80">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="relative p-6 sm:p-10 lg:p-12">{children}</section>
        </div>
      </div>
    </div>
  );
}
