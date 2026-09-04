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
import { clearAdminSession } from "@/components/admin/api";

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

  if (!authChecked) return <div className="min-h-screen bg-[#E6F2EA]" />;

  // ── Login screen ─────────────────────────────────────────────
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#E6F2EA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-[#E1E8E4]">
          <div className="p-10">
            <div className="flex items-center justify-center mb-8">
              <img src="/images/logo.svg" alt="Neerzy Logo" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#0A2E22] text-center mb-1">Admin Portal</h1>
            <p className="text-[#5B6B64] font-normal text-center mb-8">Sign in with your administrator credentials</p>

            {loginError && (
              <div className="bg-[#F7F9F8] border border-[#D3E6DA] text-[#0B3D2E] text-sm p-4 rounded-2xl mb-6 font-bold text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-[#0F5132] uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 bg-[#F7F9F8] border border-[#E1E8E4] rounded-2xl outline-none focus:border-[#22C55E] transition-colors text-[#0A2E22]"
                  placeholder="you@neerzy.com"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#0F5132] uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 bg-[#F7F9F8] border border-[#E1E8E4] rounded-2xl outline-none focus:border-[#22C55E] transition-colors text-[#0A2E22]"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-3.5 rounded-full text-base mt-2 disabled:opacity-60 transition-colors"
              >
                {loginLoading ? "Signing in…" : "Authenticate"}
              </button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-7 text-[#5B6B64]">
              <Lock className="w-3.5 h-3.5" />
              <p className="text-xs font-normal">Private · authorised staff only</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard shell ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9F8] flex font-sans text-[#0A2E22]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[#0B3D2E]/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B3D2E] text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <span className="text-xl font-bold text-white tracking-tight">
              Neerzy<span className="text-[#22C55E]">Admin</span>
            </span>
            <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
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
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:bg-white/10 hover:text-[#22C55E] transition-colors"
            >
              <LogOut className="w-5 h-5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-[#0B3D2E] text-white border-b border-white/10 flex items-center justify-between px-4 sm:px-6 lg:hidden">
          <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-white">
            Neerzy<span className="text-[#22C55E]">Admin</span>
          </span>
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

