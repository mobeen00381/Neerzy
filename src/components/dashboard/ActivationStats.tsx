"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getUpdateCount, getLastUpdateDate, getEvents } from "@/lib/analytics";
import { Activity, Globe, CheckCircle2 } from "lucide-react";

export function ActivationStats() {
  const [stats, setStats] = useState({
    updates: 0,
    lastUpdate: null as string | null,
    eventsCount: 0,
  });

  useEffect(() => {
    // Only load from localStorage on client side
    setStats({
      updates: getUpdateCount(),
      lastUpdate: getLastUpdateDate(),
      eventsCount: getEvents().length,
    });
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Updates Sent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-slate-900">{stats.updates}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {stats.updates > 0 ? "Account Activated!" : "Action needed: Send 1 update"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> Website Updated
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-slate-900">
            {stats.updates > 0 ? formatDate(stats.lastUpdate) : "Pending"}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.updates > 0 ? "Synced with live site" : "Waiting for first update"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" /> Activity Count
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-slate-900">{stats.eventsCount}</div>
          <p className="text-xs text-slate-500 mt-1">Total platform actions</p>
        </CardContent>
      </Card>
    </div>
  );
}
