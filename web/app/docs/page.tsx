import Link from "next/link";
import Image from "next/image";
import { BlockBorder } from "@/components/ui/block-border";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-11 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="StatusKeet" width={24} height={24} />
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                StatusKeet
              </span>
            </Link>
            <span className="text-white/10 text-lg select-none">/</span>
            <span className="text-[11px] font-medium text-foreground uppercase tracking-wider">
              Docs
            </span>
          </div>
          <Link
            href="/signup"
            className="text-[11px] font-medium h-7 px-3 inline-flex items-center rounded bg-green-500 text-black hover:bg-green-400 transition uppercase tracking-wider"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-20 pb-16">
        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 block mb-2">
            Documentation
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading italic mb-3">
            Get started with StatusKeet
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            StatusKeet monitors your services automatically. Install the SDK, define your services in code,
            and get a public status page that updates itself.
          </p>
        </div>

        {/* Quick start steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <section>
            <StepHeader number="01" title="Create an account & get your API key" />
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Sign up at{" "}
              <Link href="/signup" className="text-green-400 hover:text-green-300 transition">
                statuskeet.com/signup
              </Link>
              , then go to{" "}
              <Link href="/dashboard/settings" className="text-green-400 hover:text-green-300 transition">
                Dashboard → API Keys
              </Link>{" "}
              to create a key. Your key starts with <code className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded text-[11px]">sk_live_</code> and
              is only shown once — store it securely.
            </p>
          </section>

          {/* Step 2 */}
          <section>
            <StepHeader number="02" title="Install the SDK" />
            <CodeBlock language="bash" code="npm install statuskeet" />
          </section>

          {/* Step 3 */}
          <section>
            <StepHeader number="03" title="Initialize and start monitoring" />
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Define your services in code. The SDK auto-registers them on first run and begins sending
              heartbeats at your configured interval.
            </p>
            <CodeBlock
              language="javascript"
              filename="app.js"
              code={`import StatusKeet from "statuskeet";

const sk = new StatusKeet({
  apiKey: process.env.STATUSKEET_API_KEY,
  services: [
    { name: "API", type: "http", url: "https://api.example.com" },
    { name: "Worker", type: "internal" },
    { name: "Database", type: "internal", criticality: "critical" },
  ],
});

sk.start();`}
            />
          </section>

          {/* Step 4 — health checks */}
          <section>
            <StepHeader number="04" title="Add health checks (optional)" />
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Register custom health check functions that run each heartbeat cycle. If a check throws,
              the service is reported as <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-[11px]">down</code>.
            </p>
            <CodeBlock
              language="javascript"
              code={`// Check if your database is reachable
sk.check("Database", async () => {
  const start = Date.now();
  await db.query("SELECT 1");
  return {
    serviceName: "Database",
    status: "up",
    responseTimeMs: Date.now() - start,
  };
});

// Check Redis
sk.check("Cache", async () => {
  await redis.ping();
  return { serviceName: "Cache", status: "up" };
});`}
            />
          </section>

          {/* Step 5 — manual reports */}
          <section>
            <StepHeader number="05" title="Manual status reports" />
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              For event-driven updates, report status manually. The next heartbeat will include this status
              then reset to the health check result.
            </p>
            <CodeBlock
              language="javascript"
              code={`// Report degraded performance
sk.report({
  serviceName: "API",
  status: "degraded",
  metadata: { queue_depth: 15000 },
});

// Report recovery
sk.report({
  serviceName: "API",
  status: "up",
});`}
            />
          </section>

          {/* API reference */}
          <section>
            <StepHeader number="06" title="SDK reference" />
            <BlockBorder cols={2} crosses={false} className="rounded-none overflow-hidden">
              <div className="grid md:grid-cols-2">
                <RefItem
                  method="new StatusKeet(options)"
                  description="Create a new StatusKeet instance. Requires apiKey and services array."
                />
                <RefItem
                  method=".start()"
                  description="Register services and begin sending heartbeats. Returns a Promise."
                />
                <RefItem
                  method=".stop()"
                  description="Stop sending heartbeats. Safe to call multiple times."
                />
                <RefItem
                  method=".check(name, fn)"
                  description="Register a health check function for a service. Called each heartbeat."
                />
                <RefItem
                  method=".report(status)"
                  description="Manually report service status. Used once, then cleared."
                />
                <RefItem
                  method=".beat()"
                  description="Send a single heartbeat immediately. Returns HeartbeatResult."
                />
              </div>
            </BlockBorder>
          </section>

          {/* Options table */}
          <section>
            <StepHeader number="07" title="Configuration options" />
            <BlockBorder crosses className="rounded-none overflow-hidden">
              <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_100px_1fr] gap-4 px-4 py-2 border-b border-border">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Option</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Default</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Description</span>
              </div>
              <OptionRow name="apiKey" defaultVal="—" desc="Your API key (required)" required />
              <OptionRow name="services" defaultVal="—" desc="Array of service configs (required)" required />
              <OptionRow name="interval" defaultVal="30" desc="Heartbeat interval in seconds" />
              <OptionRow name="baseUrl" defaultVal="api.statuskeet.com" desc="API base URL (for self-hosted)" />
              <OptionRow name="onHeartbeat" defaultVal="—" desc="Callback after each heartbeat" />
              <OptionRow name="onError" defaultVal="—" desc="Callback on error" isLast />
            </BlockBorder>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Go and Python SDKs coming in Phase 2.{" "}
            <Link href="https://github.com/bolaabanjo/statuskeet" className="text-foreground underline underline-offset-2 hover:text-white transition">
              View source on GitHub
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] text-green-500 font-bold tracking-wider">{number}</span>
      <h2 className="text-base font-bold text-white">{title}</h2>
    </div>
  );
}

function CodeBlock({ code, language, filename }: { code: string; language: string; filename?: string }) {
  return (
    <div className="rounded-none border border-border overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        {filename && <span className="ml-2 text-[10px] text-muted-foreground">{filename}</span>}
        {!filename && <span className="ml-2 text-[10px] text-muted-foreground">{language}</span>}
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-[12px] leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RefItem({ method, description }: { method: string; description: string }) {
  return (
    <div className="p-4">
      <code className="text-[12px] text-green-400 font-mono">{method}</code>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function OptionRow({
  name,
  defaultVal,
  desc,
  required,
  isLast,
}: {
  name: string;
  defaultVal: string;
  desc: string;
  required?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`grid grid-cols-[120px_1fr] sm:grid-cols-[140px_100px_1fr] gap-4 items-center px-4 py-2.5 ${!isLast ? "border-b border-border" : ""}`}>
      <div className="flex items-center gap-1.5">
        <code className="text-[11px] text-foreground font-mono">{name}</code>
        {required && <span className="text-[9px] text-red-400">*</span>}
      </div>
      <span className="text-[11px] text-muted-foreground font-mono hidden sm:block">{defaultVal}</span>
      <span className="text-[11px] text-muted-foreground">{desc}</span>
    </div>
  );
}
