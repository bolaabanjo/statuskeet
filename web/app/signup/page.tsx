"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signup } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await signup(email.split("@")[0], email, password, orgName);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("org", JSON.stringify(data.organization));
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 font-sans text-foreground">
      <div className="w-full max-w-sm text-center">
        <Image src="/logo.png" alt="StatusKeet" width={28} height={28} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground font-heading italic mb-1">
          Join StatusKeet
        </h1>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-10">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary transition">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-none mb-6 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              className="h-10 bg-muted/20 border-border text-foreground rounded-none focus-visible:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="h-10 bg-muted/20 border-border text-foreground rounded-none focus-visible:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org" className="text-muted-foreground">
              Organization
            </Label>
            <Input
              id="org"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
              className="h-10 bg-muted/20 border-border text-foreground rounded-none focus-visible:ring-primary/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-6"
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <span className="text-foreground underline underline-offset-2">Terms of Service</span>
          {" "}and{" "}
          <span className="text-foreground underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
