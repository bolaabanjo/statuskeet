"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServices } from "@/lib/api";
import type { Service } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [userName, setUserName] = useState("");

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
    if (user) setUserName(JSON.parse(user).name);

    getServices(token).then((data) => {
      setServices(data);
      setLoading(false);
    });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("org");
    router.push("/login");
  }

  const operational = services.filter((s) => s.current_status === "operational").length;
  const degraded = services.filter((s) => s.current_status === "degraded").length;
  const down = services.filter(
    (s) => s.current_status === "major_outage" || s.current_status === "partial_outage"
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="bg-background">
        <div className="max-w-4xl mx-auto px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-1.5">
              <Image src="/S.png" alt="StatusKeet" width={16} height={16} />
              <span className="text-xs font-bold tracking-widest uppercase text-white">
                StatusKeet
              </span>
            </Link>
            {orgName && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                / {orgName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {orgSlug && (
              <Link
                href={`/s/${orgSlug}`}
                className="text-[10px] text-muted-foreground hover:text-green-400 transition uppercase tracking-wider"
              >
                Status Page
              </Link>
            )}
            {userName && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-[10px] text-muted-foreground hover:text-foreground transition uppercase tracking-wider"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
          Dashboard
        </h1>

        {loading ? (
          <div className="mt-6 text-muted-foreground text-xs">Loading...</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <DashStatCard label="Operational" value={operational} accent="green" />
              <DashStatCard label="Degraded" value={degraded} accent="yellow" />
              <DashStatCard label="Outage" value={down} accent="red" />
            </div>

            {/* Service List */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2.5">
                Services ({services.length})
              </span>
              <div className="rounded-lg bg-muted overflow-hidden">
                {services.map((service, i) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isLast={i === services.length - 1}
                  />
                ))}
                {services.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground text-xs">No services registered yet.</p>
                    <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      Use the SDK to register services via{" "}
                      <code className="text-green-400">
                        POST /v1/services/register
                      </code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DashStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <div className="rounded-lg bg-muted p-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
        {label}
      </span>
      <span className={`text-2xl font-bold ${colors[accent]}`}>{value}</span>
    </div>
  );
}

function ServiceRow({
  service,
  isLast,
}: {
  service: Service;
  isLast: boolean;
}) {
  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    operational: { label: "Operational", color: "text-green-400", dot: "bg-green-500" },
    degraded: { label: "Degraded", color: "text-yellow-400", dot: "bg-yellow-500" },
    partial_outage: { label: "Partial Outage", color: "text-orange-400", dot: "bg-orange-500" },
    major_outage: { label: "Major Outage", color: "text-red-400", dot: "bg-red-500" },
    unknown: { label: "Unknown", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  };

  const cfg = statusConfig[service.current_status] || statusConfig.unknown;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${!isLast ? "border-b border-background" : ""}`}
    >
      <div>
        <span className="text-xs font-medium text-foreground">{service.name}</span>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {service.service_type}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {service.criticality}
          </span>
          {service.url && (
            <span className="text-[10px] text-muted-foreground/50 truncate max-w-[180px]">
              {service.url}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      </div>
    </div>
  );
}
