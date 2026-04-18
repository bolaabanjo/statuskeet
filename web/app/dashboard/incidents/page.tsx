"use client";

import { useEffect, useState } from "react";
import { getPublicStatus } from "@/lib/api";
import type { PublicIncidentResponse } from "@/lib/api";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<PublicIncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      const org = localStorage.getItem("org");
      const slug = org ? JSON.parse(org).slug : "";

      if (!slug) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      const data = await getPublicStatus(slug);
      if (!cancelled) {
        setIncidents(data?.active_incidents || []);
        setLoading(false);
      }
    }

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-foreground font-heading italic">Incidents</h1>
        {incidents.length > 0 && (
          <span className="text-[10px] text-red-400">{incidents.length} active</span>
        )}
      </div>

      {incidents.length > 0 ? (
        <div className="space-y-3">
          {incidents.map((item) => {
            const { incident, updates } = item;
            const severityColors: Record<string, string> = {
              critical: "text-red-400",
              major: "text-orange-400",
              minor: "text-yellow-400",
            };

            return (
              <div key={incident.id} className="rounded-none border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xs font-bold text-white">{incident.title}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${severityColors[incident.severity] || severityColors.minor}`}>
                    {incident.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span>Status: {incident.status}</span>
                  <span>Started {new Date(incident.started_at).toLocaleString()}</span>
                </div>
                {updates.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-none border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No active incidents</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Incidents are created automatically when services go down.
          </p>
        </div>
      )}
    </>
  );
}
