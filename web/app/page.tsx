import Link from "next/link";
import Image from "next/image";
import { BlockBorder } from "@/components/ui/block-border";
import { GitHubStars } from "@/components/ui/github-stars";
import { MobileNav } from "@/components/ui/mobile-nav";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 h-11 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-10">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="StatusKeet" width={24} height={24} />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                StatusKeet
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 sm:gap-10">
              <Link href="/docs" className="text-[11px] text-muted-foreground hover:text-foreground transition uppercase tracking-wider">
                Docs
              </Link>
              <Link href="/pricing" className="text-[11px] text-muted-foreground hover:text-foreground transition uppercase tracking-wider">
                Pricing
              </Link>
              <Link href="/changelog" className="text-[11px] text-muted-foreground hover:text-foreground transition uppercase tracking-wider">
                Changelog
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <GitHubStars
              owner="bolaabanjo"
              repo="statuskeet"
              fallback={0}
              iconSize={14}
              className="text-[11px] text-muted-foreground leading-none"
            />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-[11px] uppercase tracking-wider h-7 px-3 rounded-none border-border"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "text-[11px] uppercase tracking-wider h-7 px-3 rounded-none"
              )}
            >
              Sign Up
            </Link>
          </div>
          <MobileNav />
        </div>
      </nav>

      {/* Main container with outer border rails */}
      <div className="max-w-6xl mx-auto md:border-x border-border">
        {/* Hero */}
        <section className="pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-8">
          <div className="max-w-2xl">

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight font-heading italic">
              Status pages that
              <br />
              update themselves.
            </h1>

            <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
              Enter a URL. Get automated incident detection,
              real-time uptime monitoring, and a public status page that
              always tells the truth. No code required.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "px-4 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider"
                )}
              >
                Try Free
              </Link>
              <Link
                href="/s/acme-corp"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "px-4 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider border-border/50 text-muted-foreground"
                )}
              >
                Live Demo
              </Link>
            </div>
          </div>
        </section>


        {/* Uptime Bars — edge-to-edge */}
        <section className="py-8 sm:py-14">
          <BlockBorder crosses={false} className="border-x-0">
            <div className="px-5 py-3 flex items-center justify-between border-b border-border">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Endpoint Status
              </span>
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="w-1 h-1 rounded-full bg-chart-1" />
              </div>
            </div>
            <UptimeRow 
              endpoint="Core API" 
              uptime="99.98%" 
              responseTime="45ms" 
              bars={generateBars(0.998)} 
            />
            <div className="border-t border-border" />
            <UptimeRow 
              endpoint="Authentication" 
              uptime="94.20%" 
              responseTime="241ms" 
              bars={generateBars(0.942)} 
            />
            <div className="border-t border-border" />
            <UptimeRow 
              endpoint="Service Mesh" 
              uptime="98.12%" 
              responseTime="89ms" 
              bars={generateBars(0.981)} 
            />
          </BlockBorder>
        </section>


        {/* How it works — 3-column, edge-to-edge */}
        <section className="py-8 sm:py-14">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              How it works
            </span>
            <h2 className="text-xl font-bold text-foreground font-heading italic">
              From install to live status page in 5 minutes
            </h2>
          </div>
          <BlockBorder cols={3} crosses={false} className="border-x-0">
            <div className="grid md:grid-cols-3">
              <FlowCell step="01" title="Enter your URL" description="Paste the URL of your app or API. No code or SDK required to start monitoring immediately." />
              <FlowCell step="02" title="Monitoring begins" description="Our engine pings your endpoint every 60 seconds from multiple regions to verify uptime and latency." />
              <FlowCell step="03" title="Auto-status page" description="We automatically generate a status page for you. If things go down, we detect and log the incident." />
            </div>
          </BlockBorder>
        </section>

        {/* Features — 3-column, 2-row, edge-to-edge */}
        <section className="py-8 sm:py-14 border-t border-border">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              Features
            </span>
            <h2 className="text-xl font-bold text-foreground font-heading italic">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>
          <BlockBorder cols={3} rows={2} crosses={false} className="border-x-0">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 relative z-10">
              <FeatureCell title="Instant Deployment" description="Paste a URL and you're done. No UI configuration, no deployments to wait for." />
              <FeatureCell title="Hybrid checks" description="External pings catch outages. Internal heartbeats catch degraded states your health check misses." />
              <FeatureCell title="Zero-touch incidents" description="Detected, escalated, and resolved automatically. Override manually if you need to." />
              <FeatureCell title="Public status page" description="SSR, fast, accessible. Custom domain support. No JavaScript required to render." />
              <FeatureCell title="Advanced Telemetry" description="Optional Node.js, Go, and Python SDKs. Zero dependencies. Embed deep internal health monitoring right in your codebase." />
              <FeatureCell title="MIT licensed" description="Full platform is open source. Self-host or use our cloud. No feature gates." />
            </div>
          </BlockBorder>
        </section>

        {/* Comparison — 2-column, edge-to-edge */}
        <section className="py-8 sm:py-14 border-t border-border">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              Comparison
            </span>
            <h2 className="text-xl font-bold text-foreground font-heading italic">
              Stop updating status pages manually
            </h2>
          </div>
          <BlockBorder cols={2} crosses={false} className="border-x-0">
            <div className="grid md:grid-cols-2">
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">
                  Others
                </span>
                <ul className="space-y-2.5">
                  <CompRow negative text="Manual service setup via GUI" />
                  <CompRow negative text="Manually create incidents" />
                  <CompRow negative text="Manually resolve incidents" />
                  <CompRow negative text="External pings only" />
                  <CompRow negative text="$79-399/month" />
                </ul>
              </div>
              <div className="p-5 border-t md:border-t-0 border-border">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-4">
                  StatusKeet
                </span>
                <ul className="space-y-2.5">
                  <CompRow text="URL-first auto-registration" />
                  <CompRow text="Auto-detected incidents" />
                  <CompRow text="Auto-resolved incidents" />
                  <CompRow text="Optional deep-code SDKs" />
                  <CompRow text="Free & open source" />
                </ul>
              </div>
            </div>
          </BlockBorder>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-16 border-t border-border">
          <div className="text-center px-4 sm:px-6">
            <h2 className="text-xl font-bold text-foreground font-heading italic mb-2">
              Ready to ship?
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Free forever for up to 5 services. No credit card.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider"
                )}
              >
                Get Started
              </Link>
              <Link
                href="https://github.com/bolaabanjo/statuskeet"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "px-5 py-2 rounded-none text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition"
                )}
              >
                View Source
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-5 border-t border-border mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">

              <ThemeSwitcher />
            </div>
            <span className="text-[10px] text-muted-foreground/50">
              Built by{" "}
              <a
                href="https://x.com/bolaabanjo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/50 underline underline-offset-2 hover:text-foreground transition"
              >
                Bola Banjo
              </a>
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

/* ---------- Cell Components ---------- */

function StatCell({
  label,
  value,
  sub,
  accent,
  subDown,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "green" | "primary" | "red";
  subDown?: boolean;
}) {
  const accentColors = {
    green: "text-chart-1",
    primary: "text-primary",
    red: "text-destructive",
  };

  return (
    <div className="p-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
        {label}
      </span>
      <span className={`text-xl font-bold ${accentColors[accent]}`}>
        {value}
      </span>
      <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
        {subDown !== undefined && (
          <span className={subDown ? "text-destructive" : "text-chart-1"}>
            {subDown ? "\u2193" : "\u2191"}
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}

function FlowCell({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5">
      <span className="text-[10px] text-primary font-bold tracking-wider block mb-2">
        {step}
      </span>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCell({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-5">
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function UptimeRow({
  endpoint,
  uptime,
  responseTime,
  bars,
}: {
  endpoint: string;
  uptime: string;
  responseTime: string;
  bars: string[];
}) {
  return (
    <div className="px-3 sm:px-5 py-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-foreground font-medium truncate">{endpoint}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] block">Uptime</span>
            <span className="text-xs text-chart-1 font-bold">{uptime}</span>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] block">Avg</span>
            <span className="text-xs text-foreground font-bold">{responseTime}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground shrink-0 hidden sm:block">90d</span>
        <div className="flex gap-[1px] flex-1">
          {bars.map((color, i) => (
            <div
              key={i}
              className={`h-5 flex-1 rounded-[1px] ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function generateBars(uptimeRate: number): string[] {
  let seed = Math.round(uptimeRate * 10000);
  function next() {
    seed = (seed * 16807 + 7) % 2147483647;
    return seed / 2147483647;
  }

  const bars: string[] = [];
  for (let i = 0; i < 90; i++) {
    const rand = next();
    if (rand > uptimeRate + 0.01) {
      bars.push("bg-destructive"); // Total outage (Red)
    } else if (rand > uptimeRate) {
      bars.push("bg-warning");     // Warning (Yellow)
    } else {
      bars.push("bg-chart-1");
    }
  }
  return bars;
}

function CompRow({ text, negative }: { text: string; negative?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`text-sm sm:text-base ${negative ? "text-muted-foreground/50" : "text-primary"}`}>
        {"\u2014"}
      </span>
      <span className={`text-sm sm:text-base ${negative ? "text-muted-foreground" : "text-foreground"}`}>
        {text}
      </span>
    </li>
  );
}

function Badge({ text, active }: { text: string; active?: boolean }) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-none ${
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground"
      }`}
    >
      {text}
    </span>
  );
}
