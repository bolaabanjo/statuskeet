import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicStatus } from "@/lib/api";
import type { ServiceWithUptime, PublicIncidentResponse, DailyUptime } from "@/lib/api";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicStatus(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            {data.organization.name}
          </h1>
          <StatusBanner
            status={data.overall_status}
            message={data.status_message}
          />
        </div>

        {/* Services */}
        <div className="rounded-lg bg-muted overflow-hidden">
          {data.services.map((service, i) => (
            <ServiceRow
              key={service.id}
              service={service}
              isLast={i === data.services.length - 1}
            />
          ))}
          {data.services.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No services configured yet.
            </div>
          )}
        </div>

        {/* Active Incidents */}
        {data.active_incidents.length > 0 && (
          <div className="mt-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
              Active Incidents
            </span>
            <div className="space-y-2">
              {data.active_incidents.map((item) => (
                <IncidentCard key={item.incident.id} data={item} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-green-400 transition"
          >
            Powered by StatusKeet
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({
  status,
  message,
}: {
  status: string;
  message: string;
}) {
  const config: Record<string, { text: string; dot: string }> = {
    operational: { text: "text-green-400", dot: "bg-green-500" },
    degraded: { text: "text-yellow-400", dot: "bg-yellow-500" },
    partial_outage: { text: "text-orange-400", dot: "bg-orange-500" },
    major_outage: { text: "text-red-400", dot: "bg-red-500" },
  };

  const cfg = config[status] || config.operational;

  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded ${cfg.text} text-[11px] font-bold uppercase tracking-wider bg-muted`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {message}
    </div>
  );
}

function ServiceRow({
  service,
  isLast,
}: {
  service: ServiceWithUptime;
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

  // Calculate overall uptime percentage
  const uptime = service.uptime || [];
  const totalChecks = uptime.reduce((sum, d) => sum + d.total, 0);
  const totalUp = uptime.reduce((sum, d) => sum + d.total * d.uptime_rate, 0);
  const uptimePercent = totalChecks > 0 ? (totalUp / totalChecks) * 100 : 100;

  return (
    <div
      className={`px-4 py-3 ${!isLast ? "border-b border-background" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">{service.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        </div>
      </div>
      <UptimeBars uptime={uptime} />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">90 days ago</span>
        <span className="text-[10px] text-muted-foreground">
          {uptimePercent.toFixed(2)}% uptime
        </span>
        <span className="text-[10px] text-muted-foreground">Today</span>
      </div>
    </div>
  );
}

function UptimeBars({ uptime }: { uptime: DailyUptime[] }) {
  // Build a 90-day array, filling in data where available
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
          className="flex-1 h-7 rounded-[2px]"
          style={{ backgroundColor: barColor(bar.rate) }}
          title={`${bar.date}: ${bar.hasData ? `${(bar.rate * 100).toFixed(1)}%` : "No data"}`}
        />
      ))}
    </div>
  );
}

function barColor(rate: number): string {
  if (rate >= 0.99) return "#22c55e"; // green-500
  if (rate >= 0.95) return "#eab308"; // yellow-500
  if (rate >= 0.9) return "#f97316";  // orange-500
  return "#ef4444";                    // red-500
}

function IncidentCard({ data }: { data: PublicIncidentResponse }) {
  const { incident, updates } = data;

  const severityColors: Record<string, string> = {
    critical: "text-red-400",
    major: "text-orange-400",
    minor: "text-yellow-400",
  };

  return (
    <div className="rounded-lg bg-muted p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-xs font-bold text-white">{incident.title}</h3>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider ${severityColors[incident.severity] || severityColors.minor}`}
        >
          {incident.severity}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {updates.map((update) => (
          <div key={update.id} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30 mt-1.5" />
              <div className="w-px flex-1 bg-background" />
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
    </div>
  );
}
