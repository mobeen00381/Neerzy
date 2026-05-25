"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LayoutDashboard, Users, Activity, Link2, LogOut, Lock, MessageSquare, TrendingUp, Globe, ChevronRight, Copy, Check, Plus, Trash2, Smartphone, X, Menu, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface DemoLink {
  id: string;
  code: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  used: boolean;
  usedBy?: string;
}

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  business_name: string;
  selected_plan: string;
  created_at: string;
  status: string;
  posts: number;
}

interface PostMessage {
  id: string;
  text: string;
  image?: string | null;
  source: 'whatsapp' | 'webapp';
  timestamp: string;
  date: string;
  created_at: Date;
  status: string;
  authorName?: string;
}

export default function AdminDashboard() {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Layout State
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [demoLinks, setDemoLinks] = useState<DemoLink[]>([]);
  const [globalActivity, setGlobalActivity] = useState<PostMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Statistics State
  const [stats, setStats] = useState({
    totalUsers: 0,
    mrr: 0,
    totalPosts: 0,
    activeDomains: 0
  });

  // User History Modal State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userHistory, setUserHistory] = useState<PostMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. Check Authentication on Mount
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAdminAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_token", data.token);
        setLoginError("");
      } else {
        setLoginError(data.error || "Invalid admin credentials");
      }
    } catch (err) {
      setLoginError("Failed to login. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_token");
  };

  // 2. Load Dashboard Data once authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    async function loadData() {
      setIsLoading(true);
      
      try {
        const token = sessionStorage.getItem("admin_token") || "";
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'loadData' })
        });
        if (res.status === 401) {
          setIsAdminAuthenticated(false);
          sessionStorage.removeItem("admin_auth");
          sessionStorage.removeItem("admin_token");
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch admin data');
        const data = await res.json();

        const dLinks = data.dLinks;
        const profiles = data.profiles;
        const webPosts = data.webPosts;
        const waPosts = data.waPosts;

        if (dLinks) {
          setDemoLinks(dLinks.map((d: any) => ({
            id: d.id, code: d.code, createdAt: d.created_at, expiresAt: d.expires_at, used: d.used, usedBy: d.used_by
          })));
        }

        const webPostsCount = webPosts ? webPosts.length : 0;
        const waPostsCount = waPosts ? waPosts.length : 0;
        
        let mrrCalc = 0;
        let mappedUsers: UserProfile[] = [];

        if (profiles) {
          mappedUsers = profiles.map((p: any) => {
            if (p.selected_plan === 'pro') mrrCalc += 39;
            if (p.selected_plan === 'growth') mrrCalc += 79;
            
            const userWebPosts = webPosts?.filter((wp: any) => wp.user_id === p.id).length || 0;
            const userWaPosts = waPosts?.filter((wap: any) => wap.user_phone === p.phone).length || 0;

            const status = (p.selected_plan === 'pro' || p.selected_plan === 'growth') ? 'Active' : 'Free';

            return {
              id: p.id,
              email: "User (Auth Linked)",
              phone: p.phone || "No phone",
              business_name: p.company_name || p.business_name || "Unknown Business",
              selected_plan: p.selected_plan || "free",
              created_at: p.created_at,
              status,
              posts: userWebPosts + userWaPosts
            };
          });
        }

        setUsers(mappedUsers);
        setStats({
          totalUsers: mappedUsers.length,
          mrr: mrrCalc,
          totalPosts: webPostsCount + waPostsCount,
          activeDomains: mappedUsers.filter((u: any) => u.business_name !== "Unknown Business").length
        });

        // Map global activity feed
        const mappedWeb = (webPosts || []).map((p: any) => ({
          id: p.id,
          text: p.content ? p.content.replace(/<[^>]*>/g, '') : '',
          image: p.image_url,
          source: 'webapp' as const,
          timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(p.created_at).toLocaleDateString(),
          created_at: new Date(p.created_at),
          status: p.status || 'published',
          authorName: profiles?.find((prof: any) => prof.id === p.user_id)?.business_name || 'Unknown'
        }));

        const mappedWa = (waPosts || []).map((p: any) => {
          const googlePost = p.google_post || '';
          const lines = googlePost.split('\\n');
          const extractField = (prefix: string) => {
            const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
            return line ? line.replace(new RegExp(`\\\\*{0,2}${prefix}\\\\*{0,2}`, 'i'), '').trim() : '';
          };
          const headline = extractField('HEADLINE:');
          const body = extractField('BODY:');
          const fullText = [headline, body].filter(Boolean).join('\\n');
          
          return {
            id: p.id,
            text: p.google_post ? fullText : `[Draft] Voice note/Upload: ${p.voice_note || 'Media'}`,
            image: p.images?.[0] || null,
            source: 'whatsapp' as const,
            timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(p.created_at).toLocaleDateString(),
            created_at: new Date(p.created_at),
            status: p.status === 'published' ? 'published' : 'draft',
            authorName: profiles?.find((prof: any) => prof.phone === p.user_phone)?.business_name || 'Unknown'
          };
        });

        const combinedFeed = [...mappedWeb, ...mappedWa].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        setGlobalActivity(combinedFeed.slice(0, 50)); // Keep last 50 for performance

      } catch (err) {
        console.error("Error loading admin data:", err);
      }
      setIsLoading(false);
    }

    loadData();
  }, [isAdminAuthenticated]);

  // 3. View User History
  const viewUserHistory = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsLoadingHistory(true);
    setUserHistory([]);

    try {
      const token = sessionStorage.getItem("admin_token") || "";
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'loadHistory', userId: user.id, userPhone: user.phone })
      });
      if (!res.ok) throw new Error('Failed to fetch user history');
      const data = await res.json();
      
      const webPostsData = data.webPosts || [];
      const waPostsData = data.waPosts || [];

      const mappedWeb = webPostsData.map((p: any) => ({
        id: p.id,
        text: p.content ? p.content.replace(/<[^>]*>/g, '') : '',
        image: p.image_url,
        source: 'webapp' as const,
        timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(p.created_at).toLocaleDateString(),
        created_at: new Date(p.created_at),
        status: p.status || 'published'
      }));

      const mappedWa = waPostsData.map((p: any) => {
        const googlePost = p.google_post || '';
        const lines = googlePost.split('\\n');
        const extractField = (prefix: string) => {
          const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
          return line ? line.replace(new RegExp(`\\\\*{0,2}${prefix}\\\\*{0,2}`, 'i'), '').trim() : '';
        };
        const headline = extractField('HEADLINE:');
        const body = extractField('BODY:');
        const fullText = [headline, body].filter(Boolean).join('\\n');
        
        return {
          id: p.id,
          text: p.google_post ? fullText : `[Draft] Voice note/Upload: ${p.voice_note || 'Media'}`,
          image: p.images?.[0] || null,
          source: 'whatsapp' as const,
          timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(p.created_at).toLocaleDateString(),
          created_at: new Date(p.created_at),
          status: p.status === 'published' ? 'published' : 'draft'
        };
      });

      const combined = [...mappedWeb, ...mappedWa].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      setUserHistory(combined);

    } catch (err) {
      console.error("Error loading user history", err);
    }
    
    setIsLoadingHistory(false);
  };


  // Helpers for Demo Links
  const generateDemoLink = async () => {
    try {
      const token = sessionStorage.getItem("admin_token") || "";
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'generateDemoLink' })
      });
      if (!res.ok) throw new Error('Failed');
      const { data } = await res.json();

      if (data) {
        const newLink: DemoLink = {
          id: data.id,
          code: data.code,
          createdAt: data.created_at,
          expiresAt: data.expires_at,
          used: data.used,
          usedBy: data.used_by,
        };
        setDemoLinks(prev => [newLink, ...prev]);
      }
    } catch (error) {
      console.error("Error inserting link:", error);
      alert("Failed to create demo link right now!");
    }
  };

  const copyLink = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/demo/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id: string) => {
    try {
      const token = sessionStorage.getItem("admin_token") || "";
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'deleteDemoLink', id })
      });
      if (!res.ok) throw new Error('Failed');
      setDemoLinks(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  const daysLeft = (date: Date | string) => {
    const dDate = new Date(date);
    const diff = dDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getStatus = (link: DemoLink) => {
    if (link.used) return "used";
    if (daysLeft(link.expiresAt) <= 0) return "expired";
    return "active";
  };


  // RENDER: Loading Check
  if (!authChecked) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // RENDER: Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center mb-2">Admin Portal</h1>
          <p className="text-slate-400 text-sm text-center mb-8">Sign in with your administrator credentials</p>
          
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
                className="w-full mt-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl mt-4">
              Authenticate
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER: Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <span className="text-xl font-black text-white tracking-tight">Neerzy<span className="text-blue-500">Admin</span></span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <button 
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-900 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-900 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              User Management
            </button>
            <button 
              onClick={() => { setActiveTab('activity'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-900 hover:text-white'}`}
            >
              <Activity className="w-5 h-5" />
              Global AI Feed
            </button>
            <button 
              onClick={() => { setActiveTab('demos'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'demos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-900 hover:text-white'}`}
            >
              <Link2 className="w-5 h-5" />
              Access & Demos
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-bold"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Operational
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* ======================= OVERVIEW TAB ======================= */}
            {activeTab === 'overview' && (
              <>
                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-none shadow-md overflow-hidden relative bg-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full -z-10 opacity-50" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5 h-5"/></div>
                        <span className="text-green-500 text-sm font-bold flex items-center">Live <TrendingUp className="w-3 h-3 ml-1"/></span>
                      </div>
                      <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Total Users</h3>
                      <div className="text-4xl font-black text-slate-900">{stats.totalUsers}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-md overflow-hidden relative bg-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full -z-10 opacity-50" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Activity className="w-5 h-5"/></div>
                      </div>
                      <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Est. Monthly Rev</h3>
                      <div className="text-4xl font-black text-slate-900">${stats.mrr}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md overflow-hidden relative bg-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-full -z-10 opacity-50" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><MessageSquare className="w-5 h-5"/></div>
                      </div>
                      <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Total AI Posts</h3>
                      <div className="text-4xl font-black text-slate-900">{stats.totalPosts}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md overflow-hidden relative bg-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full -z-10 opacity-50" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Globe className="w-5 h-5"/></div>
                      </div>
                      <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Active Domains</h3>
                      <div className="text-4xl font-black text-slate-900">{stats.activeDomains}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Platform Growth</CardTitle>
                      <CardDescription>Estimated revenue visualization over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end gap-2 sm:gap-6 pt-4">
                        {[40, 55, 65, 78, 92, 100].map((height, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-full bg-blue-100 rounded-t-sm relative group-hover:bg-blue-200 transition-colors" style={{ height: `${height}%` }}>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                ${(height * 1.4).toFixed(1)}k
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">M{i+1}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Pulse - Latest Signups */}
                  <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Recent Signups</CardTitle>
                      <CardDescription>The 5 newest users joining the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {users.slice(0, 5).map(u => (
                          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                              <div className="font-bold text-slate-800">{u.business_name}</div>
                              <div className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                              u.selected_plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                              u.selected_plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {u.selected_plan}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}


            {/* ======================= USERS TAB ======================= */}
            {activeTab === 'users' && (
              <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-xl font-bold">Customer Management</CardTitle>
                  <CardDescription>Comprehensive list of all registered Neerzy users.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                      <p className="text-slate-500 mt-4 font-bold animate-pulse">Loading live users...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-bold">Customer Details</th>
                            <th className="px-6 py-4 font-bold">Contact</th>
                            <th className="px-6 py-4 font-bold">Subscription</th>
                            <th className="px-6 py-4 font-bold">Total Posts</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{user.business_name}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">
                                {user.phone}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide ${
                                  user.selected_plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                                  user.selected_plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {user.selected_plan}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((user.posts / 30) * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-xs font-bold tabular-nums">{user.posts}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button 
                                  onClick={() => viewUserHistory(user)}
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 border-blue-100 hover:bg-blue-50 font-bold bg-white"
                                >
                                  History <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-500 font-medium">No users found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


            {/* ======================= ACTIVITY TAB ======================= */}
            {activeTab === 'activity' && (
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Global AI Feed</CardTitle>
                  <CardDescription>Live stream of the 50 most recent AI posts generated across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {globalActivity.map((post, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          post.source === 'whatsapp' ? 'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                        }`}>
                          {post.source === 'whatsapp' ? <MessageSquare className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                              <span className="font-black text-slate-900 text-sm block">{post.authorName}</span>
                              <span className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Via {post.source === 'whatsapp' ? 'WhatsApp' : 'Web Dashboard'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[11px] font-bold text-slate-500 block">{post.date}</span>
                                <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{post.timestamp}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                post.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {post.status}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {post.text || "Media Attachment Only"}
                            </p>
                            {post.image && (
                              <div className="mt-4 max-w-[300px] rounded-xl overflow-hidden border border-slate-200">
                                <img src={post.image} alt="Upload" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {globalActivity.length === 0 && !isLoading && (
                      <div className="text-center py-12 text-slate-500">No activity recorded yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* ======================= DEMOS TAB ======================= */}
            {activeTab === 'demos' && (
              <div className="max-w-3xl">
                <Card className="border-slate-200 shadow-md bg-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-full -z-10" />
                  <CardHeader className="pb-8">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
                      <Link2 className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900">Demo Link Manager</CardTitle>
                    <CardDescription className="text-base text-slate-600 font-medium">Generate temporary 7-day access links for prospective clients to experience Neerzy.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={generateDemoLink}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl mb-8 shadow-md"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Generate New Demo Link
                    </Button>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Active & Past Links</h3>
                      {demoLinks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">No links generated yet.</div>
                      ) : (
                        demoLinks.map((link) => {
                          const status = getStatus(link);
                          return (
                            <div key={link.id} className={`rounded-2xl p-5 transition-all ${status === 'active' ? 'bg-white border border-slate-200 shadow-sm hover:shadow-md' : 'bg-slate-50 border border-slate-100 opacity-75'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                    status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                    status === 'used' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {status === 'active' ? `${daysLeft(link.expiresAt)}d remaining` : status}
                                  </span>
                                  <span className="text-xs font-bold text-slate-400">Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => copyLink(link.code, link.id)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    {copiedId === link.id ? 'Copied' : 'Copy'}
                                  </button>
                                  <button 
                                    onClick={() => deleteLink(link.id)}
                                    className="p-2 bg-white border border-red-100 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <code className="text-sm text-slate-800 font-mono block truncate bg-slate-100/50 p-3 rounded-xl border border-slate-200/60">
                                {window.location.origin}/demo/{link.code}
                              </code>
                              {link.usedBy && <p className="text-sm font-semibold text-blue-600 mt-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Activated by: {link.usedBy}</p>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ======================= MODAL: USER HISTORY ======================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">User History</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Viewing activity for <span className="font-bold text-blue-600">{selectedUser.business_name}</span> ({selectedUser.phone})
                </p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="font-bold text-sm">Fetching detailed logs...</span>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-900 font-black mb-1">No posts generated yet</h4>
                  <p className="text-slate-500 text-sm font-medium">This user hasn't created any content.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userHistory.map((post, i) => (
                    <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex gap-4 items-start">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        post.source === 'whatsapp' ? 'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                      }`}>
                        {post.source === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            post.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {post.status}
                          </span>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-500 block">{post.date}</span>
                            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{post.timestamp}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                           <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                             {post.text || "Media Attachment Only"}
                           </p>
                           {post.image && (
                             <div className="mt-4 max-w-[200px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                               <img src={post.image} alt="Upload" className="w-full h-auto object-cover" />
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
