import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";
import { appUrl } from "@/lib/app-url";
import { PLANS } from "@/lib/plans";

const PRICING_DESCRIPTION =
  "Free, Pro ($10/mo) and Business ($15/mo) plans. Unlimited posts and votes on every plan, anonymous feedback included free — no upgrade required.";

export const metadata: Metadata = {
  title: "Pricing",
  description: PRICING_DESCRIPTION,
  alternates: { canonical: appUrl("/pricing") },
  openGraph: {
    title: "FeedBoard Pricing — Simple, Transparent Plans",
    description: PRICING_DESCRIPTION,
  },
  twitter: {
    title: "FeedBoard Pricing — Simple, Transparent Plans",
    description: PRICING_DESCRIPTION,
  },
};

/** One Product/Offer per tier, prices pulled from lib/plans.ts so this can't
    drift from what the pricing cards on this same page actually show. */
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: PLANS.map((plan, i) => ({
      "@type": "Product",
      position: i + 1,
      name: `FeedBoard ${plan.name}`,
      offers: {
        "@type": "Offer",
        price: String(plan.monthlyPrice),
        priceCurrency: "USD",
        url: appUrl("/pricing"),
      },
    })),
  };
}

export default async function PricingPage() {
  const { t } = await getTranslation();
  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <nav className="border-b border-[#e399a3]/20 bg-white/60 backdrop-blur-md">
        {/* Same shrink-not-overflow treatment as the landing nav. */}
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="hidden truncate font-display text-xl font-semibold text-[#1c0a0c] min-[420px]:inline">
              FeedBoard
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <LanguageSelector />
            <Link href="/login">
              <Button
                variant="ghost"
                className="px-2 text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959] sm:px-4"
              >
                {t("nav.signIn")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="px-3 bg-[#c74959] text-white hover:bg-[#b03f4d] sm:px-4">
                {t("nav.getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-[#1c0a0c]">
            {t("landing.pricing.heading")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#1c0a0c]/70">
            {t("pricingPage.subtitle")}
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <PricingSection />
        </div>
        <p className="mt-12 text-center text-sm text-[#1c0a0c]/50">
          {t("pricingPage.note")}
        </p>
      </main>
    </div>
  );
}
