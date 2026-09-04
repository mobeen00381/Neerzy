"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  LayoutDashboard, Users, Wallet, Target, Activity, Link2, LogOut, Lock, Menu, X,
} from "lucide-react";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import TransactionsTab from "@/components/admin/TransactionsTab";
import LeadsTab from "@/components/admin/LeadsTab";
import ActivityTab from "@/components/admin/ActivityTab";
import DemosTab from "@/components/admin/DemosTab";
import { clearAdminSession, getAdminToken } from "@/components/admin/api";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users & Quota", icon: Users },
  { id: "transactions", label: "Transactions", icon: Wallet },
  { id: "leads", label: "Leads", icon: Target },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "demos", label: "Demo Links", icon: Link2 },
] as const;

type TabId = (typeof NAV)[number]["id"];

export default function AdminDashboard() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const authed = sessionStorage.getItem("admin_auth") === "true";
    setIsAuthed(authed);
    setAuthChecked(true);
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_token", data.token);
        setIsAuthed(true);
      } else {
        setLoginError(data.error || "Invalid admin credentials");
      }
    } catch {
      setLoginError("Failed to sign in. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsAuthed(false);
  };

  if (!authChecked) return <div className="min-h-screen bg-slate-950" />;

  // ── Login screen ─────────────────────────────────────────────
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center mb-1">Neerzy Admin</h1>
          <p className="text-slate-400 text-sm text-center mb-8">Private operations dashboard</p>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center font-bold">
                {loginError}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl mt-4 disabled:opacity-60"
            >
              {loginLoading ? "Signing in…" : "Authenticate"}
            </button>
          </form>
          {!getAdminToken() && (
            <p className="text-center text-[11px] text-slate-500 mt-5">
              Tip: ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_JWT_SECRET must be set in the environment.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard shell ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <span className="text-xl font-black text-white tracking-tight">
              Neerzy<span className="text-emerald-400">Admin</span>
            </span>
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:hidden">
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-black text-slate-900">Neerzy Admin</span>
          <span className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div key={activeTab} className="animate-in fade-in duration-200">
            {activeTab === "overview" && <OverviewTab onNavigate={(t) => setActiveTab(t as TabId)} />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "transactions" && <TransactionsTab />}
            {activeTab === "leads" && <LeadsTab />}
            {activeTab === "activity" && <ActivityTab />}
            {activeTab === "demos" && <DemosTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

