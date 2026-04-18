"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registerServices, completeOnboarding } from "@/lib/api";
import { BlockBorder } from "@/components/ui/block-border";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  async function handleStartMonitoring(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const storedUser = localStorage.getItem("user");
      const fullName = storedUser ? JSON.parse(storedUser).name || "User" : "User";
      const [firstName = "User", ...restName] = String(fullName).trim().split(/\s+/);
      
      // 1. Extract a name from the URL
      let name = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (name.length > 20) name = name.substring(0, 20);

      // 2. Register the service
      await registerServices(token, [
        {
          name,
          url,
          type: "http",
          criticality: "standard",
          check_interval: 60,
        },
      ]);

      // 3. Mark onboarding as complete (backend record)
      await completeOnboarding(token, {
        first_name: firstName,
        last_name: restName.join(" "),
        company_size: "1-5",
        role: "Founder",
        use_cases: ["uptime"],
      });

      localStorage.setItem("onboarded", "true");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start monitoring");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 font-sans text-foreground">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
             <Image src="/logo.png" alt="StatusKeet" width={32} height={32} />
          </Link>
        </div>

        <BlockBorder crosses className="rounded-none p-8 bg-zinc-900/50 backdrop-blur-sm border-border">
          <h1 className="text-xl font-bold text-white mb-2 text-center font-heading italic">
            Deploy your first monitor
          </h1>
          <p className="text-xs text-muted-foreground mb-8 text-center leading-relaxed">
            Enter the URL of the application or endpoint you want to monitor.
            We&apos;ll start pinging it every 60 seconds.
          </p>

          <form onSubmit={handleStartMonitoring} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">
                App URL
              </Label>
              <Input
                id="url"
                type="url"
                required
                placeholder="https://api.myapp.com/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-11 px-4 bg-zinc-950 border-border text-white"
              />
            </div>

            {error && (
              <p className="text-[11px] text-destructive bg-destructive/5 border border-destructive/10 rounded-none p-2 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !url}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing...
                </span>
              ) : (
                "Start Monitoring"
              )}
            </Button>
          </form>
        </BlockBorder>

        <p className="mt-8 text-center text-[10px] text-muted-foreground/40 uppercase tracking-[0.1em]">
          No credit card required &middot; 2-minute setup
        </p>
      </div>
    </div>
  );
}
