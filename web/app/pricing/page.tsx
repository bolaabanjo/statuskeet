import Link from "next/link";
import Image from "next/image";
import { BlockBorder } from "@/components/ui/block-border";
import { MobileNav } from "@/components/ui/mobile-nav";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For side projects and personal apps",
    cta: "Get Started",
    href: "/signup",
    featured: false,
    features: [
      "5 services",
      "60s check interval",
      "Email notifications",
      "Public status page",
      "90-day history",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams shipping to production",
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
    features: [
      "25 services",
      "30s check interval",
      "Custom domain",
      "Slack & webhook alerts",
      "1-year history",
      "Priority support",
      "Team members (up to 5)",
      "API access",
    ],
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For engineering teams that need reliability",
    cta: "Start Free Trial",
    href: "/signup",
    featured: false,
    features: [
      "100 services",
      "10s check interval",
      "Multi-region checks",
      "Maintenance windows",
      "Unlimited history",
      "Dedicated support",
      "Unlimited team members",
      "SSO (coming soon)",
      "SLA guarantee",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 h-11 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-10">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/s.png" alt="StatusKeet" width={24} height={24} />
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                StatusKeet
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 sm:gap-10">
              <Link href="/docs" className="text-[11px] text-muted-foreground hover:text-white transition uppercase tracking-wider">
                Docs
              </Link>
              <Link href="/pricing" className="text-[11px] text-white transition uppercase tracking-wider font-medium">
                Pricing
              </Link>
              <Link href="/changelog" className="text-[11px] text-muted-foreground hover:text-white transition uppercase tracking-wider">
                Changelog
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[11px] font-medium h-7 px-3 inline-flex items-center rounded border border-white/[0.06] text-foreground hover:text-white transition uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-[11px] font-medium h-7 px-3 inline-flex items-center rounded bg-green-500 text-black hover:bg-green-400 transition uppercase tracking-wider"
            >
              Sign Up
            </Link>
          </div>
          <MobileNav />
        </div>
      </nav>

      {/* Main container with outer border rails */}
      <div className="max-w-6xl mx-auto md:border-x border-white/[0.06]">
        {/* Header */}
        <section className="pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-8 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 block mb-2">
            Pricing
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading mb-3">
            Free for side projects. Scales with you.
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Start monitoring for free. Upgrade when you need custom domains,
            faster intervals, or multi-region checks.
          </p>
        </section>

        {/* Tier cards — edge-to-edge */}
        <BlockBorder cols={3} crosses={false} className="border-x-0">
          <div className="grid md:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.name} className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {tier.name}
                  </span>
                  {tier.featured && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-6">{tier.description}</p>

                <Link
                  href={tier.href}
                  className={`block text-center text-[11px] font-medium py-2.5 rounded-lg uppercase tracking-wider transition ${
                    tier.featured
                      ? "bg-green-500 text-black hover:bg-green-400"
                      : "border border-white/[0.06] text-foreground hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  {tier.cta}
                </Link>

                <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[12px] text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </BlockBorder>

        {/* Enterprise — edge-to-edge */}
        <section className="py-8 sm:py-14">
          <BlockBorder crosses={false} className="border-x-0">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
                  Enterprise
                </span>
                <h3 className="text-base font-bold text-white mb-1">Need more?</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Custom limits, SSO, dedicated infrastructure, SLA guarantees, and onboarding support.
                </p>
              </div>
              <Link
                href="mailto:hello@statuskeet.com"
                className="shrink-0 text-[11px] font-medium h-9 px-5 inline-flex items-center rounded border border-white/[0.06] text-foreground hover:text-white hover:border-white/[0.12] transition uppercase tracking-wider"
              >
                Contact Sales
              </Link>
            </div>
          </BlockBorder>
        </section>

        {/* FAQ */}
        <section className="py-8 sm:py-14 border-t border-white/[0.06]">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <h2 className="text-lg font-bold text-white font-heading text-center">
              Common questions
            </h2>
          </div>
          <BlockBorder cols={2} crosses={false} className="border-x-0">
            <div className="grid md:grid-cols-2">
              <div className="p-5">
                <FaqItem
                  question="Can I self-host StatusKeet?"
                  answer="Yes. StatusKeet is fully open source under the MIT license. Clone the repo, run the Go backend and PostgreSQL, and you're set."
                />
              </div>
              <div className="p-5">
                <FaqItem
                  question="What happens when I hit the service limit?"
                  answer="The SDK will still send heartbeats, but new services won't be registered until you upgrade or remove existing ones."
                />
              </div>
              <div className="p-5">
                <FaqItem
                  question="Is there a free trial for paid plans?"
                  answer="Yes, Pro and Team plans come with a 14-day free trial. No credit card required to start."
                />
              </div>
              <div className="p-5">
                <FaqItem
                  question="Can I change plans later?"
                  answer="Anytime. Upgrades are instant. Downgrades take effect at the end of your billing cycle."
                />
              </div>
            </div>
          </BlockBorder>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-5 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              StatusKeet v0.1
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              Open Source &middot; MIT
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1.5">{question}</h3>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}
