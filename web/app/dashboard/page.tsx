"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { getPublicStatus } from "@/lib/api";
import type { ServiceWithUptime, PublicIncidentResponse, PublicStatusResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [statusData, setStatusData] = useState<PublicStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const org = localStorage.getItem("org");
    const user = localStorage.getItem("user");
    if (org) {
      const parsed = JSON.parse(org);
      setOrgName(parsed.name);
      setOrgSlug(parsed.slug);
    }
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name);
      setUserEmail(parsed.email || "");
    }

    const slug = org ? JSON.parse(org).slug : "";
    if (slug) {
      getPublicStatus(slug).then((data) => {
        setStatusData(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [router]);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("org");
    router.push("/login");
  }

  const services = statusData?.services || [];
  const incidents = statusData?.active_incidents || [];
  const overallStatus = statusData?.overall_status || "operational";
  const statusMessage = statusData?.status_message || "All Systems Operational";

  const operational = services.filter((s) => s.current_status === "operational").length;
  const degraded = services.filter((s) => s.current_status === "degraded").length;
  const down = services.filter(
    (s) => s.current_status === "major_outage" || s.current_status === "partial_outage"
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Breadcrumb Nav */}
      <nav className="border-b border-white/[0.06]">
        <div className="px-6 h-12 flex items-center justify-between">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-0">
            <Link href="/" className="flex items-center pr-2.5">
              <Image src="/s.png" alt="StatusKeet" width={20} height={20} />
            </Link>

            {/* Separator */}
            <span className="text-white/10 text-lg select-none">/</span>

            {/* Org switcher */}
            <div className="relative" ref={orgMenuRef}>
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md hover:bg-white/[0.04] transition"
              >
                <span className="text-[13px] font-semibold text-foreground font-heading">
                  {orgName || "Organization"}
                </span>
                <span className="text-[9px] font-medium text-muted-foreground bg-white/[0.06] px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Free
                </span>
                {/* Chevron up/down */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-muted-foreground ml-0.5"
                >
                  <path d="M5 6.5L8 4L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9.5L8 12L11 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Org dropdown menu */}
              {orgMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-muted border border-white/[0.06] rounded-lg shadow-xl z-50 py-1">
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Organization
                    </p>
                  </div>
                  <div className="p-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.04]">
                      <Avatar name={orgName || "O"} size="xs" variant="green" />
                      <span className="text-xs text-foreground font-medium">{orgName}</span>
                      <svg className="w-3.5 h-3.5 text-green-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.06] p-1 mt-1">
                    <button className="w-full text-left px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                      Create organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {orgSlug && (
              <Link
                href={`/s/${orgSlug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Status page
              </Link>
            )}
            {userName && (
              <div className="relative" ref={avatarMenuRef}>
                <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}>
                  <Avatar
                    name={userName}
                    size="md"
                    variant="muted"
                    className="cursor-pointer hover:ring-2 hover:ring-white/10 transition rounded-full"
                  />
                </button>

                {avatarMenuOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-60 bg-muted border border-white/[0.06] rounded-lg shadow-xl z-50 py-1">
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <p className="text-sm font-medium text-foreground">{userName}</p>
                      {userEmail && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{userEmail}</p>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="p-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
                        onClick={() => setAvatarMenuOpen(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>

                      {/* Theme toggle */}
                      <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        Theme
                      </button>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/[0.06] p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-red-400 hover:bg-white/[0.04] transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-semibold text-foreground font-heading">Overview</h1>
              <StatusPill status={overallStatus} message={statusMessage} />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Services (2/3) */}
              <div className="col-span-2 space-y-6">
                {/* Services table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Services
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {services.length} registered
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_80px_100px] gap-4 px-4 py-2 border-b border-white/[0.06]">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Name</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Type</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Priority</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right">Status</span>
                    </div>
                    {services.map((service, i) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        isLast={i === services.length - 1}
                      />
                    ))}
                    {services.length === 0 && (
                      <div className="p-10 text-center">
                        <p className="text-sm text-muted-foreground">No services yet</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Register via the SDK with{" "}
                          <code className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded text-[11px]">
                            POST /v1/services/register
                          </code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Incidents */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Active Incidents
                    </span>
                    {incidents.length > 0 && (
                      <span className="text-[10px] text-red-400">{incidents.length} open</span>
                    )}
                  </div>
                  {incidents.length > 0 ? (
                    <div className="space-y-2">
                      {incidents.map((item) => (
                        <IncidentCard key={item.incident.id} data={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/[0.06] p-6 text-center">
                      <p className="text-xs text-muted-foreground">No active incidents</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar (1/3) */}
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="rounded-lg border border-white/[0.06] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
                    System Health
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Operational</span>
                      <span className="text-xs font-medium text-green-400">{operational}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Degraded</span>
                      <span className="text-xs font-medium text-yellow-400">{degraded}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Outage</span>
                      <span className="text-xs font-medium text-red-400">{down}</span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-xs font-medium text-foreground">{services.length}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-lg border border-white/[0.06] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
                    Quick Actions
                  </span>
                  <div className="space-y-1">
                    {orgSlug && (
                      <Link
                        href={`/s/${orgSlug}`}
                        className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        View status page
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                      Manage API keys
                    </Link>
                  </div>
                </div>

                {/* Integration hint */}
                <div className="rounded-lg border border-white/[0.06] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
                    Getting Started
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Register services from your app using the SDK. Services auto-appear here once they send their first heartbeat.
                  </p>
                  <pre className="mt-3 text-[11px] text-green-400/80 bg-green-500/5 rounded px-3 py-2 overflow-x-auto">
                    <code>POST /v1/services/register</code>
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Dashboard Components ---------- */

function StatusPill({ status, message }: { status: string; message: string }) {
  const config: Record<string, { text: string; dot: string; bg: string }> = {
    operational: { text: "text-green-400", dot: "bg-green-500", bg: "bg-green-500/10" },
    degraded: { text: "text-yellow-400", dot: "bg-yellow-500", bg: "bg-yellow-500/10" },
    partial_outage: { text: "text-orange-400", dot: "bg-orange-500", bg: "bg-orange-500/10" },
    major_outage: { text: "text-red-400", dot: "bg-red-500", bg: "bg-red-500/10" },
  };
  const cfg = config[status] || config.operational;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${cfg.bg} ${cfg.text} text-[11px] font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {message}
    </div>
  );
}

function ServiceRow({ service, isLast }: { service: ServiceWithUptime; isLast: boolean }) {
  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    operational: { label: "Operational", color: "text-green-400", dot: "bg-green-500" },
    degraded: { label: "Degraded", color: "text-yellow-400", dot: "bg-yellow-500" },
    partial_outage: { label: "Partial Outage", color: "text-orange-400", dot: "bg-orange-500" },
    major_outage: { label: "Major Outage", color: "text-red-400", dot: "bg-red-500" },
    unknown: { label: "Unknown", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  };
  const cfg = statusConfig[service.current_status] || statusConfig.unknown;

  return (
    <div className={`grid grid-cols-[1fr_100px_80px_100px] gap-4 items-center px-4 py-3 ${!isLast ? "border-b border-white/[0.06]" : ""}`}>
      <div>
        <span className="text-xs font-medium text-foreground">{service.name}</span>
        {service.url && (
          <span className="block text-[10px] text-muted-foreground/50 truncate mt-0.5">{service.url}</span>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground">{service.service_type}</span>
      <span className="text-[11px] text-muted-foreground capitalize">{service.criticality}</span>
      <div className="flex items-center justify-end gap-2">
        <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      </div>
    </div>
  );
}

function IncidentCard({ data }: { data: PublicIncidentResponse }) {
  const { incident, updates } = data;
  const severityColors: Record<string, string> = {
    critical: "text-red-400",
    major: "text-orange-400",
    minor: "text-yellow-400",
  };

  return (
    <div className="rounded-lg border border-white/[0.06] p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-xs font-bold text-white">{incident.title}</h3>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${severityColors[incident.severity] || severityColors.minor}`}>
          {incident.severity}
        </span>
      </div>
      {updates.length > 0 && (
        <div className="mt-3 space-y-2">
          {updates.map((update) => (
            <div key={update.id} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30 mt-1.5" />
                <div className="w-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="pb-2">
                <p className="text-[11px] text-muted-foreground">{update.message}</p>
                <time className="text-[10px] text-muted-foreground/50 mt-0.5 block">
                  {new Date(update.created_at).toLocaleString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10px] text-muted-foreground/50">
        Started {new Date(incident.started_at).toLocaleString()}
      </div>
    </div>
  );
}
