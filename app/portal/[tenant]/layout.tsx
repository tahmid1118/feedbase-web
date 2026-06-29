import { notFound } from "next/navigation";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { PortalLogo } from "@/components/portal/portal-logo";

const DEFAULT_BRAND = "#c74959";

// Portal data is shared across visitors, so it's a good ISR candidate. This
// takes effect once the public reads are cacheable (they're POST today, which
// Next's Data Cache can't cache — see lib/api/public.ts). Until then the route
// renders dynamically but streams via loading.tsx.
export const revalidate = 30;

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const info = await publicApi.getTenant(decodeURIComponent(tenant));

  if (!info) notFound();

  const brand = info.branding_primary_color || DEFAULT_BRAND;

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <PortalLogo
              logoUrl={info.branding_logo_url}
              name={info.name}
              brand={brand}
            />
            <span className="text-lg font-bold text-[#1c0a0c]">
              {info.name}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-[#1c0a0c]/40">
        Powered by Feedbase
      </footer>
    </div>
  );
}
