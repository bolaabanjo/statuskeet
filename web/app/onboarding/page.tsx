"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { completeOnboarding } from "@/lib/api";

const companySizes = ["1-5", "6-20", "21-100", "101-500", "500+"];

const roles = [
  "Software engineer",
  "DevOps / SRE",
  "Engineering manager",
  "CTO / VP Engineering",
  "Product manager",
  "Founder",
  "Other",
];

const useCases = [
  {
    id: "uptime",
    title: "Uptime monitoring",
    description: "Monitor your endpoints and get alerted when they go down",
  },
  {
    id: "status-page",
    title: "Public status page",
    description: "Give your users a dedicated page to check service health",
  },
  {
    id: "incidents",
    title: "Incident management",
    description: "Automatically detect, track, and resolve incidents",
  },
  {
    id: "heartbeats",
    title: "Heartbeat monitoring",
    description: "Track cron jobs, background workers, and scheduled tasks",
  },
  {
    id: "api-monitoring",
    title: "API monitoring",
    description: "Monitor response times and error rates for your APIs",
  },
  {
    id: "internal",
    title: "Internal services",
    description: "Monitor databases, queues, and internal infrastructure",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [role, setRole] = useState("");

  // Step 2
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Step 3 (setup screen)
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const org = localStorage.getItem("org");
    if (org) {
      setCompany(JSON.parse(org).name || "");
    }
  }, [router]);

  function toggleUseCase(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      setError("");

      // Animate progress bar
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15;
        if (p > 90) p = 90;
        setProgress(p);
      }, 200);

      try {
        const token = localStorage.getItem("token") || "";
        await completeOnboarding(token, {
          first_name: firstName,
          last_name: lastName,
          company_size: companySize,
          role,
          use_cases: Array.from(selected),
        });

        clearInterval(interval);
        setProgress(100);

        setTimeout(() => {
          localStorage.setItem("onboarded", "true");
          router.push("/dashboard");
        }, 600);
      } catch (err) {
        clearInterval(interval);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStep(2);
      }
    }
  }

  const step1Valid = firstName.trim() && lastName.trim() && companySize && role;
  const step2Valid = selected.size > 0;

  // Step 3: Setup screen
  if (step === 3) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4 font-sans">
        <div className="w-full max-w-sm text-center">
          <Image src="/s.png" alt="StatusKeet" width={28} height={28} className="mx-auto mb-6" />
          <h1 className="text-lg font-semibold text-white mb-2">
            Setting up your account
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            StatusKeet monitors your services, detects incidents,
            and keeps your status page honest.
          </p>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 font-sans">
      <div className="w-full max-w-sm text-center">
        <Image src="/s.png" alt="StatusKeet" width={28} height={28} className="mx-auto mb-6" />

        {step === 1 ? (
          <>
            <p className="text-sm text-green-400 mb-1">Welcome aboard</p>
            <h1 className="text-lg font-semibold text-white mb-8">
              Tell us a bit about yourself
            </h1>

            <div className="text-left space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">
                  Company size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition appearance-none"
                >
                  <option value="" disabled>Select</option>
                  {companySizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1.5">
                  What&apos;s your role?
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition appearance-none"
                >
                  <option value="" disabled>Select</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!step1Valid}
              className="w-full mt-6 py-2.5 bg-green-500 text-sm text-black font-medium rounded-lg hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            {error && (
              <div className="p-2.5 text-sm text-red-400 bg-red-500/10 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground transition mb-6 inline-flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>

            <h1 className="text-lg font-semibold text-white mb-1">
              Great to have you, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              What are you looking to monitor?
            </p>

            <div className="grid grid-cols-2 gap-3 text-left">
              {useCases.map((uc) => {
                const active = selected.has(uc.id);
                return (
                  <button
                    key={uc.id}
                    onClick={() => toggleUseCase(uc.id)}
                    className={`relative text-left rounded-lg border p-4 transition ${
                      active
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      active
                        ? "border-green-500 bg-green-500"
                        : "border-white/[0.12]"
                    }`}>
                      {active && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-foreground mb-1 pr-6">
                      {uc.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {uc.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={!step2Valid}
              className="w-full mt-6 py-2.5 bg-green-500 text-sm text-black font-medium rounded-lg hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
