"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("org", JSON.stringify(data.organization));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 font-sans">
      <div className="w-full max-w-sm text-center">
        <Image src="/logo.png" alt="StatusKeet" width={28} height={28} className="mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-white mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-2 hover:text-white transition">
            Sign up
          </Link>
        </p>  

        <form onSubmit={handleSubmit} className="text-left">
          {error && (
            <div className="p-2.5 text-sm text-red-400 bg-red-500/10 rounded-lg mb-4">
              {error}
            </div>
          )}

          <label htmlFor="email" className="block text-sm text-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition mb-4"
            placeholder="m@example.com"
          />

          <label htmlFor="password" className="block text-sm text-foreground mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/50 transition mb-6"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-500 text-sm text-black font-medium rounded-lg hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
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
