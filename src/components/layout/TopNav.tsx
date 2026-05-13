// components/layout/TopNav.tsx
"use client";

import { Bell, Search, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function TopNav() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search posts, reviews, or settings..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-10 w-px bg-slate-100" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900">{user?.email?.split('@')[0] || "User"}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.user_metadata?.selected_plan || "Free"} Plan</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
