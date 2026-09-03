'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Users, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface Trader {
  id: string;
  client_name: string | null;
  client_phone: string;
  status: string;
  posts_used: number;
  reviews_sent: number;
}

interface PanelData {
  max_clients: number;
  traders: Trader[];
  pool: {
    posts_used: number;
    posts_daily_used: number;
    posts_limit: number;
    reviews_used: number;
    reviews_daily_used: number;
    reviews_limit: number;
  };
}

const fmt = (n: number) => (n ?? 0).toLocaleString();

export function AgencyClientsPanel() {
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/agency/clients', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
      });
      if (res.status === 403) {
        setData(null);
        return;
      }
      if (!res.ok) throw new Error('Could not load your traders');
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || 'Could not load your traders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTrader = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ action: 'add', phone, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not add trader');
      setPhone('');
      setName('');
      setNotice(`✅ Trader added. Ask them to send a photo + type POST from their WhatsApp to connect.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not add trader.');
    } finally {
      setBusy(false);
    }
  };

  const removeTrader = async (id: string, traderName: string) => {
    if (!window.confirm(`Remove ${traderName || 'this trader'} from your agency? This frees up one of your ${data?.max_clients ?? 10} slots.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ action: 'remove', id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Could not remove trader');
      }
      setNotice('Trader removed.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not remove trader.');
    } finally {
      setBusy(false);
    }
  };

  const slots = data?.max_clients ?? 10;
  const usedSlots = data?.traders.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> My Traders
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Up to {slots} traders · each gets 30 posts + 30 review requests/month (3/day) · every trader gets Google + Facebook + Instagram posts.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-700 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your traders...
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-semibold">{error}</div>
          )}
          {notice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-semibold">{notice}</div>
          )}

          {/* Agency pool */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Agency Pool — This Month · Traders: {usedSlots}/{slots}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">📝 Posts (pool)</span>
                  <span className="text-slate-800">{fmt(data?.pool.posts_used ?? 0)} / {data?.pool.posts_limit ?? 300} · {fmt(data?.pool.posts_daily_used ?? 0)} today</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, ((data?.pool.posts_used ?? 0) / (data?.pool.posts_limit || 300)) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">⭐ Review requests (pool)</span>
                  <span className="text-slate-800">{fmt(data?.pool.reviews_used ?? 0)} / {data?.pool.reviews_limit ?? 300} · {fmt(data?.pool.reviews_daily_used ?? 0)} today</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, ((data?.pool.reviews_used ?? 0) / (data?.pool.reviews_limit || 300)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Trader list + add form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Your Traders</p>

            {(data?.traders || []).length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No traders yet. Add your first trader below — they just send job photos from their own WhatsApp, exactly like a normal Neerzy user.
              </div>
            ) : (
              <div className="space-y-3">
                {data!.traders.map(t => (
                  <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {(t.client_name || t.client_phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">{t.client_name || 'Trader'}</span>
                        {t.status === 'connected' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                            <Clock className="w-3 h-3" /> Invited
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-semibold truncate">{t.client_phone}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 shrink-0">
                      <span title="Posts this month">📝 {t.posts_used}/30</span>
                      <span title="Review requests this month">⭐ {t.reviews_sent}/30</span>
                      <button
                        onClick={() => removeTrader(t.id, t.client_name || '')}
                        disabled={busy}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-40"
                        title="Remove trader"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add trader */}
            {usedSlots < slots ? (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Add Trader ({usedSlots}/{slots} used)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Business name (e.g., Mike's Plumbing)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="WhatsApp number (+15551234567)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={addTrader}
                    disabled={busy || !phone.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors disabled:opacity-40 shrink-0"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Trader
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-2">
                  💡 After adding, ask the trader to send a job photo + type POST from their WhatsApp number — they&apos;ll get Google + Facebook + Instagram posts automatically.
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-700 font-bold pt-2 border-t border-slate-100">
                You&apos;ve reached {slots} traders. Remove one to add another.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
