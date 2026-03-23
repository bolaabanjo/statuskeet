import Link from "next/link";
import Image from "next/image";
import { BlockBorder } from "@/components/ui/block-border";
import { GitHubStars } from "@/components/ui/github-stars";
import { MobileNav } from "@/components/ui/mobile-nav";

export default function Home() {
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
              <Link href="/pricing" className="text-[11px] text-muted-foreground hover:text-white transition uppercase tracking-wider">
                Pricing
              </Link>
              <Link href="/changelog" className="text-[11px] text-muted-foreground hover:text-white transition uppercase tracking-wider">
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
        {/* Hero */}
        <section className="pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Status // Monitoring
              </span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-green-600">
                Open Source
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight font-heading">
              Status pages that
              <br />
              update themselves.
            </h1>

            <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
              Drop in three lines of code. Get automated incident detection,
              real-time uptime monitoring, and a public status page that
              always tells the truth. No dashboards to babysit.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/signup"
                className="px-4 py-2 bg-green-500 text-black rounded text-[11px] font-bold uppercase tracking-wider hover:bg-green-400 transition"
              >
                Get Started Free
              </Link>
              <Link
                href="/s/acme-corp"
                className="px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition"
              >
                Live Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Stats — 4-column, edge-to-edge */}
        <BlockBorder cols={4} crosses={false} className="border-x-0">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <StatCell label="Overall Uptime" value="99.97%" sub="Last 30 days" accent="green" />
            <StatCell label="Avg Response" value="142ms" sub="12% from last week" accent="orange" subDown />
            <StatCell label="Services" value="2,847" sub="23% from last week" accent="green" />
            <StatCell label="Incidents" value="3" sub="Across all orgs" accent="red" />
          </div>
        </BlockBorder>

        {/* Uptime Bars — edge-to-edge */}
        <section className="py-8 sm:py-14">
          <BlockBorder crosses={false} className="border-x-0">
            <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Endpoint Status
              </span>
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="w-1 h-1 rounded-full bg-green-500" />
              </div>
            </div>
            <UptimeRow method="GET" endpoint="/api/v1/health" uptime="99.98%" responseTime="45ms" bars={generateBars(0.998)} />
            <div className="border-t border-white/[0.06]" />
            <UptimeRow method="POST" endpoint="/api/v1/heartbeat" uptime="99.95%" responseTime="132ms" bars={generateBars(0.995)} />
            <div className="border-t border-white/[0.06]" />
            <UptimeRow method="GET" endpoint="/api/v1/services" uptime="99.99%" responseTime="89ms" bars={generateBars(0.999)} />
          </BlockBorder>
        </section>

        {/* Code Snippet — 2-column, edge-to-edge */}
        <BlockBorder cols={2} crosses={false} className="border-x-0">
            <div className="grid md:grid-cols-2">
              <div className="p-4 sm:p-6 flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
                  Integration
                </span>
                <h2 className="text-xl font-bold text-white font-heading mb-2">
                  Three lines. That&apos;s it.
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Define your services in code. The SDK handles registration,
                  heartbeats, and graceful degradation. If StatusKeet goes down,
                  your app doesn&apos;t notice.
                </p>
                <div className="flex gap-2">
                  <Badge text="Node.js" active />
                  <Badge text="Go" />
                  <Badge text="Python" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                  <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                  <div className="w-2 h-2 rounded-full bg-[#28c840]" />
                  <span className="ml-2 text-[10px] text-muted-foreground">app.js</span>
                </div>
                <pre className="text-xs leading-relaxed overflow-x-auto">
                  <code>
                    <span className="text-[#c792ea]">import</span>
                    <span className="text-muted-foreground">{" { StatusKeet } "}</span>
                    <span className="text-[#c792ea]">from</span>
                    <span className="text-[#c3e88d]">{" 'statuskeet'"}</span>
                    {"\n\n"}
                    <span className="text-muted-foreground/50">{"// That's all you need"}</span>
                    {"\n"}
                    <span className="text-[#c792ea]">const</span>
                    <span className="text-[#82aaff]"> monitor</span>
                    <span className="text-muted-foreground">{" = StatusKeet."}</span>
                    <span className="text-[#ffcb6b]">init</span>
                    <span className="text-muted-foreground">{"({"}</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"  apiKey: "}</span>
                    <span className="text-[#c3e88d]">{"process.env.SK_KEY"}</span>
                    <span className="text-muted-foreground">,</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"  services: ["}</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"    { "}</span>
                    <span className="text-[#82aaff]">name</span>
                    <span className="text-muted-foreground">{": "}</span>
                    <span className="text-[#c3e88d]">{"'API'"}</span>
                    <span className="text-muted-foreground">{", "}</span>
                    <span className="text-[#82aaff]">type</span>
                    <span className="text-muted-foreground">{": "}</span>
                    <span className="text-[#c3e88d]">{"'http'"}</span>
                    <span className="text-muted-foreground">{" },"}</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"    { "}</span>
                    <span className="text-[#82aaff]">name</span>
                    <span className="text-muted-foreground">{": "}</span>
                    <span className="text-[#c3e88d]">{"'DB'"}</span>
                    <span className="text-muted-foreground">{", "}</span>
                    <span className="text-[#82aaff]">check</span>
                    <span className="text-muted-foreground">{": "}</span>
                    <span className="text-[#ffcb6b]">db.ping</span>
                    <span className="text-muted-foreground">{" },"}</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"  ]"}</span>
                    {"\n"}
                    <span className="text-muted-foreground">{"})"}</span>
                  </code>
                </pre>
              </div>
            </div>
        </BlockBorder>

        {/* How it works — 3-column, edge-to-edge */}
        <section className="py-8 sm:py-14">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              How it works
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              From install to live status page in 5 minutes
            </h2>
          </div>
          <BlockBorder cols={3} crosses={false} className="border-x-0">
            <div className="grid md:grid-cols-3">
              <FlowCell step="01" title="Install & configure" description="npm install statuskeet. Define services in your code. They register automatically on first heartbeat." />
              <FlowCell step="02" title="Monitoring begins" description="Heartbeats every 30s from the SDK. External pings from our infra. Both signals feed the status evaluator." />
              <FlowCell step="03" title="Auto-incidents" description="Checks fail? Incident created. Things recover? Incident resolved. Status page updates in real-time." />
            </div>
          </BlockBorder>
        </section>

        {/* Features — 3-column, 2-row, edge-to-edge */}
        <section className="py-8 sm:py-14 border-t border-white/[0.06]">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              Features
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>
          <BlockBorder cols={3} rows={2} crosses={false} className="border-x-0">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 relative z-10">
              <FeatureCell title="Code-first" description="Services defined in your codebase. Version-controlled. No UI to drift out of sync." />
              <FeatureCell title="Hybrid checks" description="External pings catch outages. Internal heartbeats catch degraded states your health check misses." />
              <FeatureCell title="Zero-touch incidents" description="Detected, escalated, and resolved automatically. Override manually if you need to." />
              <FeatureCell title="Public status page" description="SSR, fast, accessible. Custom domain support. No JavaScript required to render." />
              <FeatureCell title="Multi-SDK" description="Node.js, Go, Python. Zero dependencies. Non-blocking. Your app never knows we're there." />
              <FeatureCell title="MIT licensed" description="Full platform is open source. Self-host or use our cloud. No feature gates." />
            </div>
          </BlockBorder>
        </section>

        {/* Comparison — 2-column, edge-to-edge */}
        <section className="py-8 sm:py-14 border-t border-white/[0.06]">
          <div className="px-4 sm:px-6 mb-6 sm:mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              Comparison
            </span>
            <h2 className="text-xl font-bold text-white font-heading">
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
              <div className="p-5 border-t md:border-t-0 border-white/[0.06]">
                <span className="text-[10px] uppercase tracking-[0.2em] text-green-600 block mb-4">
                  StatusKeet
                </span>
                <ul className="space-y-2.5">
                  <CompRow text="Services defined in code, auto-registered" />
                  <CompRow text="Auto-detected incidents" />
                  <CompRow text="Auto-resolved incidents" />
                  <CompRow text="Hybrid: external + internal" />
                  <CompRow text="Free & open source" />
                </ul>
              </div>
            </div>
          </BlockBorder>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-16 border-t border-white/[0.06]">
          <div className="text-center px-4 sm:px-6">
            <h2 className="text-xl font-bold text-white font-heading mb-2">
              Ready to ship?
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Free forever for up to 5 services. No credit card.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="px-5 py-2 bg-green-500 text-black rounded text-[11px] font-bold uppercase tracking-wider hover:bg-green-400 transition"
              >
                Get Started
              </Link>
              <Link
                href="https://github.com/bolaabanjo/statuskeet"
                className="px-5 py-2 rounded border border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition"
              >
                View Source
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-5 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              StatusKeet v0.1
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              Built by{" "}
              <a
                href="https://x.com/bolaabanjo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/50 underline underline-offset-2 hover:text-white transition"
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
  accent: "green" | "orange" | "red";
  subDown?: boolean;
}) {
  const accentColors = {
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400",
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
          <span className={subDown ? "text-red-500" : "text-green-500"}>
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
      <span className="text-[10px] text-green-500 font-bold tracking-wider block mb-2">
        {step}
      </span>
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
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
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function UptimeRow({
  method,
  endpoint,
  uptime,
  responseTime,
  bars,
}: {
  method: string;
  endpoint: string;
  uptime: string;
  responseTime: string;
  bars: string[];
}) {
  const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-orange-400",
  };

  return (
    <div className="px-3 sm:px-5 py-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold shrink-0 ${methodColors[method] || methodColors.GET}`}>
            {method}
          </span>
          <span className="text-xs text-foreground truncate">{endpoint}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] block">Uptime</span>
            <span className="text-xs text-green-400 font-bold">{uptime}</span>
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
      bars.push("bg-red-500");
    } else if (rand > uptimeRate) {
      bars.push("bg-orange-500");
    } else if (rand > uptimeRate - 0.005) {
      bars.push("bg-yellow-500/60");
    } else {
      bars.push("bg-green-500");
    }
  }
  return bars;
}

function CompRow({ text, negative }: { text: string; negative?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`text-sm sm:text-base ${negative ? "text-muted-foreground/50" : "text-green-500"}`}>
        {negative ? "\u2014" : "\u2022"}
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
      className={`text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded ${
        active
          ? "text-green-400 bg-green-500/10"
          : "text-muted-foreground"
      }`}
    >
      {text}
    </span>
  );
}
