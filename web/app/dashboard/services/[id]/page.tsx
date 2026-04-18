"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BlockBorder } from "@/components/ui/block-border";
import { getServiceDetail } from "@/lib/api";
import type { ServiceDetailResponse, DailyUptime, CheckResult } from "@/lib/api";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ServiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;

    getServiceDetail(token, id).then((resp) => {
      setData(resp);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Service not found</p>
        <Link href="/dashboard" className="text-xs text-green-400 hover:text-green-300 mt-2 inline-block">
          Back to overview
        </Link>
      </div>
    );
  }

  const { service, uptime, recent_checks } = data;
  const uptimeData = uptime || [];
  const checks = recent_checks || [];

  const totalChecks = uptimeData.reduce((sum, d) => sum + d.total, 0);
  const totalUp = uptimeData.reduce((sum, d) => sum + d.total * d.uptime_rate, 0);
  const uptimePercent = totalChecks > 0 ? (totalUp / totalChecks) * 100 : 100;

  const avgResponseTime = checks.length > 0
    ? Math.round(
        checks
          .filter((c) => c.response_time !== null)
          .reduce((sum, c) => sum + (c.response_time || 0), 0) /
        (checks.filter((c) => c.response_time !== null).length || 1)
      )
    : null;

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    operational: { label: "Operational", color: "text-green-400", dot: "bg-green-500" },
    degraded: { label: "Degraded", color: "text-yellow-400", dot: "bg-yellow-500" },
    partial_outage: { label: "Partial Outage", color: "text-orange-400", dot: "bg-orange-500" },
    major_outage: { label: "Major Outage", color: "text-red-400", dot: "bg-red-500" },
    unknown: { label: "Unknown", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  };
  const cfg = statusConfig[service.current_status] || statusConfig.unknown;

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 text-[11px]">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">
          Overview
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-foreground font-medium">{service.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground font-heading italic">{service.name}</h1>
          {service.url && (
            <p className="text-xs text-muted-foreground mt-0.5">{service.url}</p>
          )}
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium ${cfg.color}`}
          style={{ backgroundColor: cfg.dot === "bg-green-500" ? "rgba(34,197,94,0.1)" : cfg.dot === "bg-yellow-500" ? "rgba(234,179,8,0.1)" : cfg.dot === "bg-orange-500" ? "rgba(249,115,22,0.1)" : cfg.dot === "bg-red-500" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)" }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      </div>

      {/* Stats */}
      <BlockBorder cols={4} crosses={false} className="rounded-none mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <div className="p-3 sm:p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Uptime</span>
            <span className="text-xl font-bold text-green-400">{uptimePercent.toFixed(2)}%</span>
          </div>
          <div className="p-3 sm:p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Avg Response</span>
            <span className="text-xl font-bold text-foreground">{avgResponseTime !== null ? `${avgResponseTime}ms` : "—"}</span>
          </div>
          <div className="p-3 sm:p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Type</span>
            <span className="text-xl font-bold text-foreground">{service.service_type}</span>
          </div>
          <div className="p-3 sm:p-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">Interval</span>
            <span className="text-xl font-bold text-foreground">{service.check_interval}s</span>
          </div>
        </div>
      </BlockBorder>

      {/* Uptime chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Uptime — Last 90 Days
          </span>
          <span className="text-[10px] text-muted-foreground">
            {totalChecks} checks
          </span>
        </div>
        <BlockBorder crosses className="rounded-none p-4">
          <UptimeBars uptime={uptimeData} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">90 days ago</span>
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </BlockBorder>
      </div>

      {/* Recent checks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Recent Checks
          </span>
          <span className="text-[10px] text-muted-foreground">
            Last {checks.length}
          </span>
        </div>
        <BlockBorder crosses className="rounded-none overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2 border-b border-border">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Time</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Response</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right hidden sm:block">Source</span>
          </div>
          {checks.length > 0 ? (
            checks.map((check, i) => (
              <CheckRow key={check.id} check={check} isLast={i === checks.length - 1} />
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-xs text-muted-foreground">No checks recorded yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Checks appear once the SDK starts sending heartbeats.
              </p>
            </div>
          )}
        </BlockBorder>
      </div>
    </>
  );
}

function UptimeBars({ uptime }: { uptime: DailyUptime[] }) {
  const uptimeMap = new Map(uptime.map((d) => [d.date, d]));
  const bars: { rate: number; hasData: boolean; date: string }[] = [];

  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    const day = uptimeMap.get(key);
    bars.push({
      rate: day ? day.uptime_rate : 1,
      hasData: !!day,
      date: key,
    });
  }

  return (
    <div className="flex gap-px">
      {bars.map((bar) => (
        <div
          key={bar.date}
          className="flex-1 h-8 rounded-[2px]"
          style={{ backgroundColor: bar.hasData ? barColor(bar.rate) : "rgba(255,255,255,0.04)" }}
          title={`${bar.date}: ${bar.hasData ? `${(bar.rate * 100).toFixed(1)}%` : "No data"}`}
        />
      ))}
    </div>
  );
}

function barColor(rate: number): string {
  if (rate >= 0.99) return "#22c55e";
  if (rate >= 0.95) return "#eab308";
  if (rate >= 0.9) return "#f97316";
  return "#ef4444";
}

function CheckRow({ check, isLast }: { check: CheckResult; isLast: boolean }) {
  const statusColors: Record<string, string> = {
    up: "text-green-400",
    down: "text-red-400",
    degraded: "text-yellow-400",
    timeout: "text-orange-400",
  };

  return (
    <div className={`grid grid-cols-[1fr_80px_80px_80px] gap-4 items-center px-4 py-2.5 ${!isLast ? "border-b border-border" : ""}`}>
      <span className="text-[11px] text-muted-foreground">
        {new Date(check.checked_at).toLocaleString()}
      </span>
      <span className={`text-[11px] font-medium ${statusColors[check.status] || "text-muted-foreground"}`}>
        {check.status}
      </span>
      <span className="text-[11px] text-muted-foreground hidden sm:block">
        {check.response_time !== null ? `${check.response_time}ms` : "—"}
      </span>
      <span className="text-[11px] text-muted-foreground text-right hidden sm:block">
        {check.source}
      </span>
    </div>
  );
}
