"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, TrendingUp, Activity, Globe, Download, ChevronRight, Copy, Check, Plus, Trash2, MessageSquare, Lock, LogOut, Smartphone, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
}

export default function AdminDashboard() {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Dashboard Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [demoLinks, setDemoLinks] = useState<DemoLink[]>([]);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === "mobeen0381@gmail.com" && loginPassword === "mobeenadmin") {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Invalid admin credentials");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
  };

  // 2. Load Dashboard Data once authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    async function loadData() {
      setIsLoading(true);
      
      try {
        // Fetch Demo Links
        const { data: dLinks } = await supabase.from("demo_links").select("*").order("created_at", { ascending: false });
        if (dLinks) {
          setDemoLinks(dLinks.map(d => ({
            id: d.id, code: d.code, createdAt: d.created_at, expiresAt: d.expires_at, used: d.used, usedBy: d.used_by
          })));
        }

        // Fetch Profiles
        const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        
        // Fetch posts counts
        const { data: webPosts } = await supabase.from("posts").select("user_id, status");
        const { data: waPosts } = await supabase.from("pending_posts").select("user_phone, status");

        const webPostsCount = webPosts ? webPosts.length : 0;
        const waPostsCount = waPosts ? waPosts.length : 0;
        
        let mrrCalc = 0;
        let mappedUsers: UserProfile[] = [];

        if (profiles) {
          mappedUsers = profiles.map(p => {
            // Calculate MRR roughly based on standard plans
            if (p.selected_plan === 'pro') mrrCalc += 39;
            if (p.selected_plan === 'growth') mrrCalc += 79;
            
            const userWebPosts = webPosts?.filter(wp => wp.user_id === p.id).length || 0;
            const userWaPosts = waPosts?.filter(wap => wap.user_phone === p.phone).length || 0;

            // Rough status calculation
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
          activeDomains: mappedUsers.filter(u => u.business_name !== "Unknown Business").length
        });

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
      let webPostsData: any[] = [];
      const { data: webData } = await supabase.from("posts").select("*").eq("user_id", user.id);
      if (webData) webPostsData = webData;

      let waPostsData: any[] = [];
      if (user.phone && user.phone !== "No phone") {
        const { data: waData } = await supabase.from("pending_posts").select("*").eq("user_phone", user.phone);
        if (waData) waPostsData = waData;
      }

      const mappedWeb = webPostsData.map(p => ({
        id: p.id,
        text: p.content ? p.content.replace(/<[^>]*>/g, '') : '',
        image: p.image_url,
        source: 'webapp' as const,
        timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(p.created_at).toLocaleDateString(),
        created_at: new Date(p.created_at),
        status: p.status || 'published'
      }));

      const mappedWa = waPostsData.map(p => {
        const googlePost = p.google_post || '';
        const lines = googlePost.split('\n');
        const extractField = (prefix: string) => {
          const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
          return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
        };
        const headline = extractField('HEADLINE:');
        const body = extractField('BODY:');
        const fullText = [headline, body].filter(Boolean).join('\n');
        
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
    const code = `early_access_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("demo_links")
      .insert([{ code, expires_at: expiresAt, used: false }])
      .select()
      .single();

    if (error) {
      console.error("Error inserting link:", error);
      alert("Failed to create demo link right now!");
      return;
    }

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
  };

  const copyLink = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/demo/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("demo_links").delete().eq("id", id);
    if (!error) {
      setDemoLinks(prev => prev.filter(l => l.id !== id));
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

  // RENDER: Dashboard
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your SEO SaaS empire and monitor AI generation.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleLogout} variant="outline" className="bg-white hover:bg-red-50 text-red-600 border-red-100 shadow-sm font-bold">
               <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-bold">
               Manage Billing
            </Button>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-md overflow-hidden relative">
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
          
          <Card className="border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full -z-10 opacity-50" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Activity className="w-5 h-5"/></div>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Monthly Rec. Rev</h3>
              <div className="text-4xl font-black text-slate-900">${stats.mrr}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-full -z-10 opacity-50" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><MessageSquare className="w-5 h-5"/></div>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Total AI Posts</h3>
              <div className="text-4xl font-black text-slate-900">{stats.totalPosts}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden relative">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Revenue Growth</CardTitle>
              <CardDescription>Monthly recurring revenue for the trailing 6 months.</CardDescription>
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

          <Card className="border-slate-200 shadow-sm bg-slate-900 text-white relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-30" />
             <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                   <span className="text-green-400 font-bold text-xs uppercase tracking-wider">Early Access</span>
                </div>
                <CardTitle className="text-xl font-bold text-white">Demo Link Manager</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-slate-400 text-sm mb-4">Generate 1-week demo links for prospects. No subscription required.</p>
                
                <Button 
                  onClick={generateDemoLink}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold mb-4 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" /> Generate Demo Link
                </Button>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {demoLinks.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">No links generated yet.</div>
                  ) : (
                    demoLinks.map((link) => {
                      const status = getStatus(link);
                      return (
                        <div key={link.id} className={`rounded-xl p-3 text-sm ${status === 'active' ? 'bg-slate-800 border border-slate-700' : 'bg-slate-800/50 border border-slate-700/50 opacity-60'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              status === 'active' ? 'bg-green-500/20 text-green-400' : 
                              status === 'used' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600/30 text-slate-500'
                            }`}>
                              {status === 'active' ? `${daysLeft(link.expiresAt)}d left` : status}
                            </span>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => copyLink(link.code, link.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              >
                                {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => deleteLink(link.id)}
                                className="p-1.5 rounded-lg hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <code className="text-xs text-slate-300 font-mono block truncate">/demo/{link.code}</code>
                          {link.usedBy && <p className="text-xs text-slate-500 mt-1">Used by: {link.usedBy}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Recent Signups</CardTitle>
              <CardDescription>Your newest recurring revenue customers.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="text-center py-10">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                 <p className="text-slate-500 mt-4 font-bold animate-pulse">Loading live users...</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-y border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">Customer Details</th>
                      <th className="px-6 py-4 font-bold">Contact</th>
                      <th className="px-6 py-4 font-bold">Subscription</th>
                      <th className="px-6 py-4 font-bold">Total Posts</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{user.business_name}</div>
                          <div className="text-xs text-slate-500 font-medium">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                            user.selected_plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                            user.selected_plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.selected_plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((user.posts / 30) * 100, 100)}%` }} />
                             </div>
                             <span className="text-xs font-bold">{user.posts}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            onClick={() => viewUserHistory(user)}
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-100 hover:bg-blue-50 font-bold"
                          >
                            View History <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL: USER HISTORY */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">User Post History</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Viewing activity for <span className="font-bold text-slate-800">{selectedUser.business_name}</span> ({selectedUser.phone})
                </p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="font-bold text-sm">Fetching detailed logs...</span>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-700 font-bold mb-1">No posts generated yet</h4>
                  <p className="text-slate-500 text-sm">This user hasn't created any content via WhatsApp or the Web App.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userHistory.map((post, i) => (
                    <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex gap-4 items-start">
                      {/* Icon Status */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        post.source === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {post.source === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            post.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {post.status}
                          </span>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-400 block">{post.date}</span>
                            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{post.timestamp}</span>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {post.text || "Media Attachment Only"}
                        </p>

                        {post.image && (
                          <div className="mt-3 max-w-[200px] rounded-lg overflow-hidden border border-slate-200">
                            <img src={post.image} alt="Upload" className="w-full h-auto object-cover" />
                          </div>
                        )}
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
