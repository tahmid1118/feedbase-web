import { ArrowRight, BarChart3, Bell, CheckCircle2, GitBranch, Heart, MessageSquare, Star, TrendingUp, Users, Vote, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#fdf8f9]">
      {/* Navigation */}
      <nav className="border-b border-[#e399a3]/20 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c74959] to-[#da6a78] text-white">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]">
                Get Started
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
            <span>Trusted by 300K+ users worldwide</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight text-[#1c0a0c] sm:text-6xl lg:text-7xl">
            Turn Customer Feedback Into{" "}
            <span className="bg-gradient-to-r from-[#c74959] to-[#da6a78] bg-clip-text text-transparent">
              Product Success
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-[#1c0a0c]/70 sm:text-xl">
            Collect, organize, and prioritize user feedback effortlessly. Build products your customers actually want with our all-in-one feedback management platform.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="h-12 bg-[#c74959] px-8 text-base text-white hover:bg-[#b03f4d]">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 border-[#c74959] bg-transparent px-8 text-base text-[#c74959] hover:bg-[#c74959] hover:text-white">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">Everything You Need</h2>
          <p className="text-lg text-[#1c0a0c]/70">Powerful features to manage feedback at scale</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Feedback Collection</h3>
            <p className="text-[#1c0a0c]/70">Gather insights from customers through customizable feedback boards and forms</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Vote className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Smart Voting System</h3>
            <p className="text-[#1c0a0c]/70">Let users upvote features they want most to prioritize your roadmap effectively</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Visual Roadmap</h3>
            <p className="text-[#1c0a0c]/70">Share your product roadmap publicly and keep customers in the loop</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#da6a78]/10 text-[#da6a78]">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Smart Notifications</h3>
            <p className="text-[#1c0a0c]/70">Keep users engaged with automated updates on their feedback status</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#c74959]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c74959]/10 text-[#c74959]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Analytics Dashboard</h3>
            <p className="text-[#1c0a0c]/70">Track trends, measure engagement, and make data-driven decisions</p>
          </div>

          <div className="group rounded-2xl border border-[#e399a3]/20 bg-white p-6 transition-all hover:border-[#da6a78]/40 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e399a3]/20 text-[#c74959]">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Multi-Tenant Support</h3>
            <p className="text-[#1c0a0c]/70">Manage multiple workspaces with custom domains and branding</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[#e399a3]/20 bg-gradient-to-r from-[#c74959] to-[#da6a78] py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold text-white">300K+</div>
              <div className="text-white/90">Active Users</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-white">15K+</div>
              <div className="text-white/90">Plugin Users</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-white">200+</div>
              <div className="text-white/90">ProductHunt Upvotes</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">How Does it Work?</h2>
          <p className="text-lg text-[#1c0a0c]/70">Get your personalized feedback portal in 4 steps</p>
        </div>

        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c74959] text-xl font-bold text-white">1</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Sign up and create your workspace</h3>
              <p className="text-[#1c0a0c]/70">Start with our magical setup wizard to get your feedback portal ready in minutes</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#da6a78] text-xl font-bold text-white">2</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Customize your branding</h3>
              <p className="text-[#1c0a0c]/70">Choose your primary and secondary colors, add your logo, and make it yours</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c74959] text-xl font-bold text-white">3</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Invite your team and customers</h3>
              <p className="text-[#1c0a0c]/70">Share your feedback board link and start collecting valuable insights</p>
            </div>
          </div>

          <div className="flex gap-6 rounded-2xl border border-[#e399a3]/20 bg-white p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#da6a78] text-xl font-bold text-white">4</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-[#1c0a0c]">Analyze and take action</h3>
              <p className="text-[#1c0a0c]/70">Export data in various formats, integrate with your tools, and build better products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#fdf8f9] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#1c0a0c]">Loved by Product Teams</h2>
            <p className="text-lg text-[#1c0a0c]/70">What people are saying about Feedbase</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#c74959]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">"Feedbase transformed how we collect and prioritize user feedback. The voting system is brilliant!"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c74959]/20 text-[#c74959]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Sarah Chen</div>
                  <div className="text-sm text-[#1c0a0c]/70">Product Manager</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#da6a78]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">"Setup took less than 5 minutes. The interface is clean and our customers love it!"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#da6a78]/20 text-[#da6a78]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Marcus Rodriguez</div>
                  <div className="text-sm text-[#1c0a0c]/70">Startup Founder</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e399a3]/20 bg-white p-6">
              <div className="mb-4 flex gap-1 text-[#c74959]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mb-4 text-[#1c0a0c]/70">"The analytics dashboard gives us insights we never had before. Highly recommend!"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e399a3]/30 text-[#c74959]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1c0a0c]">Emily Watson</div>
                  <div className="text-sm text-[#1c0a0c]/70">UX Designer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#c74959] to-[#da6a78] p-12 text-center text-white">
          <h2 className="mb-4 text-4xl font-bold">Ready to Build Better Products?</h2>
          <p className="mb-8 text-lg text-white/90">Join thousands of teams using Feedbase to understand their customers</p>
          <Link href="/signup">
            <Button size="lg" className="h-12 bg-white px-8 text-base text-[#c74959] hover:bg-[#fdf8f9]">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e399a3]/20 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#1c0a0c]/70">
          <p>© 2026 Feedbase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
