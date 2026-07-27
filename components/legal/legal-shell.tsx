import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { legal, legalHref, legalPages, type LegalSlug } from "@/lib/legal";

/**
 * Shared chrome and typography for the four legal documents.
 *
 * These pages are deliberately NOT localized. i18next machine translations are
 * fine for UI labels but a mistranslated liability or refund clause is a real
 * problem, so the documents state English as the authoritative version — the
 * normal approach for a small SaaS.
 */
export function LegalShell({
  slug,
  summary,
  children,
}: {
  slug: LegalSlug;
  /** One or two sentences in plain language, above the formal text. */
  summary: string;
  children: ReactNode;
}) {
  const page = legalPages.find((p) => p.slug === slug)!;

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <header className="border-b border-[#e399a3]/20 bg-white/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="hidden truncate text-xl font-bold text-[#1c0a0c] min-[420px]:inline">
              {legal.product}
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#1c0a0c]/70 transition-colors hover:bg-[#c74959]/10 hover:text-[#c74959]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c74959]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#1c0a0c] sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-3 text-base text-[#1c0a0c]/70">{summary}</p>
        <p className="mt-4 text-sm text-[#1c0a0c]/50">
          Last updated {legal.lastUpdated}. English is the authoritative version
          of this document.
        </p>

        {/* Switcher — the four documents cross-reference each other constantly,
            so make moving between them one tap. */}
        <nav className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <ul className="flex min-w-max items-center gap-1 rounded-xl border border-[#e399a3]/30 bg-white p-1">
            {legalPages.map((p) => (
              <li key={p.slug}>
                <Link
                  href={legalHref(p.slug)}
                  className={
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                    (p.slug === slug
                      ? "bg-[#c74959] text-white"
                      : "text-[#1c0a0c]/70 hover:bg-[#c74959]/10 hover:text-[#c74959]")
                  }
                >
                  {p.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 space-y-8">{children}</div>

        <div className="mt-12 rounded-xl border border-[#e399a3]/30 bg-white p-5">
          <h2 className="text-base font-semibold text-[#1c0a0c]">Questions</h2>
          <p className="mt-1 text-sm text-[#1c0a0c]/70">
            Email{" "}
            <a
              href={`mailto:${legal.contactEmail}`}
              className="font-medium text-[#c74959] hover:underline"
            >
              {legal.contactEmail}
            </a>
            {slug === "privacy" || slug === "cookies" ? (
              <>
                {" "}
                for general questions, or{" "}
                <a
                  href={`mailto:${legal.privacyEmail}`}
                  className="font-medium text-[#c74959] hover:underline"
                >
                  {legal.privacyEmail}
                </a>{" "}
                for anything about your personal data.
              </>
            ) : (
              " and we'll get back to you."
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

/** A numbered top-level clause. */
export function Clause({
  n,
  heading,
  children,
}: {
  n: number;
  heading: string;
  children: ReactNode;
}) {
  const id = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-bold text-[#1c0a0c]">
        <span className="text-[#c74959]">{n}.</span> {heading}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-[#1c0a0c]/80">
        {children}
      </div>
    </section>
  );
}

/** Bulleted list. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-1 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c74959]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A scrollable table — used for the cookie and subprocessor lists. */
export function LegalTable({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e399a3]/30">
            {head.map((h) => (
              <th
                key={h}
                className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[#1c0a0c]/50"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#e399a3]/15 align-top">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-[#1c0a0c]/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders a value from lib/legal.ts, or a loud marker if it hasn't been filled
 * in — so a missing registered address is obvious in review instead of shipping
 * as an empty sentence.
 */
export function Fill({ value, label }: { value: string; label: string }) {
  if (value) return <>{value}</>;
  return (
    <mark className="rounded bg-yellow-200 px-1 font-semibold text-[#1c0a0c]">
      [ADD: {label}]
    </mark>
  );
}
