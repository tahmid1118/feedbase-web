import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";

export const metadata = {
  title: "Pricing — Feedbase",
  description: "Simple, transparent pricing. Start free, upgrade as you grow.",
};

export default async function PricingPage() {
  const { t } = await getTranslation();
  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      <nav className="border-b border-[#e399a3]/20 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]"
              >
                {t("nav.signIn")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]">
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
