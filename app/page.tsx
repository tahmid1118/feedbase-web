import { ArrowRight, BarChart3, Bell, CheckCircle2, GitBranch, MessageSquare, Star, TrendingUp, Users, Vote, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PricingSection } from "@/components/pricing/pricing-section";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { getTranslation } from "@/lib/i18n/server";

export default async function HomePage() {
  const session = await auth();
  const { t } = await getTranslation();

  if (session?.user?.userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      {/* Navigation */}
      <nav className="border-b border-[#e399a3]/20 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="ghost" className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]">
                {t("nav.pricing")}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c74959]/20 bg-white/80 px-4 py-2 text-sm text-[#c74959]">
            <Zap className="h-4 w-4" />
            <span>{t("landing.hero.badge")}</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight text-[#1c0a0c] sm:text-6xl lg:text-7xl">
            {t("landing.hero.titleLead")}{" "}
            <span className="bg-gradient-to-r from-[#c74959] to-[#da6a78] bg-clip-text text-transparent">
              {t("landing.hero.titleHighlight")}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-[#1c0a0c]/70 sm:text-xl">
            {t("landing.hero.subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="h-12 bg-[#c74959] px-8 text-base text-white hover:bg-[#b03f4d]">
                {t("landing.hero.startTrial")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 border-[#c74959] bg-transparent px-8 text-base text-[#c74959] hover:bg-[#c74959] hover:text-white">
              {t("landing.hero.watchDemo")}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.features.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.features.subheading")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.collection.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.collection.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Vote className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.voting.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.voting.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.roadmap.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.roadmap.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.notifications.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.notifications.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.analytics.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.analytics.desc")}</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.features.multitenant.title")}</h3>
            <p className="text-[#1c0a0c]/70">{t("landing.features.multitenant.desc")}</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[#e399a3]/20 bg-gradient-to-r from-[#c74959] to-[#da6a78] py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold text-white">300K+</div>
              <div className="text-white/90">{t("landing.stats.activeUsers")}</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-white">15K+</div>
              <div className="text-white/90">{t("landing.stats.pluginUsers")}</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-white">200+</div>
              <div className="text-white/90">{t("landing.stats.productHunt")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.how.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.how.subheading")}</p>
        </div>

        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c74959] text-xl font-bold text-white">1</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.how.step1Title")}</h3>
              <p className="text-[#1c0a0c]/70">{t("landing.how.step1Desc")}</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#da6a78] text-xl font-bold text-white">2</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.how.step2Title")}</h3>
              <p className="text-[#1c0a0c]/70">{t("landing.how.step2Desc")}</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c74959] text-xl font-bold text-white">3</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.how.step3Title")}</h3>
              <p className="text-[#1c0a0c]/70">{t("landing.how.step3Desc")}</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#da6a78] text-xl font-bold text-white">4</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">{t("landing.how.step4Title")}</h3>
              <p className="text-[#1c0a0c]/70">{t("landing.how.step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#fdf8f9] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.testimonials.heading")}</h2>
            <p className="text-lg text-[#1c0a0c]/70">{t("landing.testimonials.subheading")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#c74959]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">&ldquo;{t("landing.testimonials.quote1")}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c74959]/20 text-[#c74959]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Sarah Chen</div>
                  <div className="text-sm text-[#1c0a0c]/70">{t("landing.testimonials.role1")}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#da6a78]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">&ldquo;{t("landing.testimonials.quote2")}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#da6a78]/20 text-[#da6a78]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Marcus Rodriguez</div>
                  <div className="text-sm text-[#1c0a0c]/70">{t("landing.testimonials.role2")}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#c74959]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">&ldquo;{t("landing.testimonials.quote3")}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e399a3]/30 text-[#c74959]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Emily Watson</div>
                  <div className="text-sm text-[#1c0a0c]/70">{t("landing.testimonials.role3")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">{t("landing.pricing.heading")}</h2>
          <p className="text-lg text-[#1c0a0c]/70">{t("landing.pricing.subheading")}</p>
        </div>
        <div className="mx-auto max-w-5xl">
          <PricingSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#c74959] to-[#da6a78] p-12 text-center text-white">
          <h2 className="mb-4 text-4xl font-bold">{t("landing.cta.heading")}</h2>
          <p className="mb-8 text-lg text-white/90">{t("landing.cta.subheading")}</p>
          <Link href="/signup">
            <Button size="lg" className="h-12 bg-white px-8 text-base text-[#c74959] hover:bg-[#fdf8f9]">
              {t("landing.hero.startTrial")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e399a3]/20 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#1c0a0c]/70">
          <p>{t("landing.footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
