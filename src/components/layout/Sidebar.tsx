// components/layout/Sidebar.tsx
"use client";

import { LayoutDashboard, Send, MessageSquare, History, Settings, Zap, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Shield, label: "GMB Audit", href: "/gmb-audit-tool" },
  { icon: Send, label: "Posts", href: "/dashboard/posts" },
  { icon: MessageSquare, label: "Reviews", href: "/dashboard/reviews" },
  { icon: History, label: "History", href: "/dashboard/history" },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center">
          <img src="/images/logo.png" alt="Neerzy Logo" className="h-14 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
              pathname === item.href 
                ? "bg-teal-50 text-[#0F5C4D]" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-4">
        <Link 
          href="/dashboard/settings"
          className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
