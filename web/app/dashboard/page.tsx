"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicStatus } from "@/lib/api";
import { BlockBorder } from "@/components/ui/block-border";
import type { ServiceWithUptime, PublicIncidentResponse, PublicStatusResponse } from "@/lib/api";

export default function DashboardPage() {
  const [statusData, setStatusData] = useState<PublicStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const org = localStorage.getItem("org");
    const slug = org ? JSON.parse(org).slug : "";
    if (slug) {
      getPublicStatus(slug).then((data) => {
        setStatusData(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const services = statusData?.services || [];
  const incidents = statusData?.active_incidents || [];
  const overallStatus = statusData?.overall_status || "operational";
  const statusMessage = statusData?.status_message || "All Systems Operational";

  const operational = services.filter((s) => s.current_status === "operational").length;
  const degraded = services.filter((s) => s.current_status === "degraded").length;
  const down = services.filter(
    (s) => s.current_status === "major_outage" || s.current_status === "partial_outage"
  ).length;

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-lg font-semibold text-foreground font-heading">Overview</h1>
        <StatusPill status={overallStatus} message={statusMessage} />
      </div>

      {/* Stats row */}
      <BlockBorder cols={4} rows={1} crosses={false} className="rounded-lg mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <StatCard label="Operational" value={operational} color="text-green-400" />
          <StatCard label="Degraded" value={degraded} color="text-yellow-400" />
          <StatCard label="Outage" value={down} color="text-red-400" />
          <StatCard label="Total" value={services.length} color="text-foreground" />
        </div>
      </BlockBorder>

      {/* Services table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Services
          </span>
          <span className="text-[10px] text-muted-foreground">
            {services.length} registered
          </span>
        </div>
        <BlockBorder crosses className="rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_100px_80px_100px] gap-4 px-4 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Name</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Type</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Priority</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right">Status</span>
          </div>
          {services.map((service, i) => (
            <ServiceRow key={service.id} service={service} isLast={i === services.length - 1} />
          ))}
          {services.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No services yet</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Install the SDK and services will appear here automatically.
              </p>
            </div>
          )}
        </BlockBorder>
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
          <BlockBorder crosses className="rounded-lg p-6 text-center">
            <p className="text-xs text-muted-foreground">No active incidents</p>
          </BlockBorder>
        )}
      </div>
    </>
  );
}

/* ---------- Components ---------- */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 sm:p-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
        {label}
      </span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

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
    <Link
      href={`/dashboard/services/${service.id}`}
      className={`grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_100px_80px_100px] gap-4 items-center px-4 py-3 hover:bg-white/[0.02] transition ${!isLast ? "border-b border-white/[0.06]" : ""}`}
    >
      <div>
        <span className="text-xs font-medium text-foreground">{service.name}</span>
        {service.url && (
          <span className="block text-[10px] text-muted-foreground/50 truncate mt-0.5">{service.url}</span>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground hidden sm:block">{service.service_type}</span>
      <span className="text-[11px] text-muted-foreground capitalize hidden sm:block">{service.criticality}</span>
      <div className="flex items-center justify-end gap-2">
        <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      </div>
    </Link>
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
