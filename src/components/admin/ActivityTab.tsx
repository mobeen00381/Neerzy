// src/components/admin/ActivityTab.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { RefreshCw, MessageSquare, Smartphone } from "lucide-react";
import { adminFetch } from "@/components/admin/api";
import { Spinner, EmptyState } from "@/components/admin/ui";
import type { ActivityPost } from "@/lib/admin-types";

export default function ActivityTab() {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await adminFetch<{ activity: ActivityPost[] }>("/api/admin/feed");
      setPosts(d.activity || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Activity</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Latest AI-generated posts across every trader (WhatsApp + dashboard).
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          {error && <p className="text-xs font-bold text-red-600 mb-3">{error}</p>}
          {loading && !posts.length ? (
            <Spinner label="Loading feed…" />
          ) : posts.length === 0 ? (
            <EmptyState message="No posts generated yet." />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 flex gap-4 items-start">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      post.source === "whatsapp"
                        ? "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white"
                        : "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                    }`}
                  >
                    {post.source === "whatsapp" ? <MessageSquare className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="font-black text-slate-900 text-sm">{post.author}</span>
                        <span className="text-[11px] font-bold text-slate-400 ml-2 uppercase tracking-wider">
                          Via {post.source === "whatsapp" ? "WhatsApp" : "Web dashboard"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">{post.date} · {post.time}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          post.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {post.text || "Media attachment only"}
                      </p>
                      {post.image && (
                        <img src={post.image} alt="Post" className="mt-3 max-w-[260px] rounded-xl border border-slate-200" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
