"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, TrendingUp, Activity, Globe, MessageSquare, Download, ChevronRight, CheckCircle2, Link2, Copy, Check, Plus, Clock, Trash2 } from "lucide-react";
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

export default function AdminDashboard() {
  const users = [
    { id: 1, name: "Acme Plumbing", email: "john@acmeplumbing.com", plan: "Pro", status: "Trial", domain: "acmeplumbing.com", posts: 12 },
    { id: 2, name: "Texas Electric", email: "sarah@texaselectric.com", plan: "Basic", status: "Active", domain: "texaselectric.com", posts: 7 },
    { id: 3, name: "Sparkle Cleaning", email: "mike@sparklecleaning.com", plan: "Basic", status: "Active", domain: "sparklecleaning.com", posts: 5 },
    { id: 4, name: "Frostbite Cooling", email: "david@frostbite.com", plan: "Pro", status: "Active", domain: "frostbitecooling.com", posts: 22 },
    { id: 5, name: "Demo User", email: "—", plan: "Demo", status: "Demo", domain: "demo-preview.seojunction.com", posts: 2 },
  ];

  const [demoLinks, setDemoLinks] = useState<DemoLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch links from Supabase
  useEffect(() => {
    async function fetchLinks() {
      const { data, error } = await supabase
        .from("demo_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching demo links:", error);
      } else if (data) {
        const formatted = data.map((d) => ({
          id: d.id,
          code: d.code,
          createdAt: d.created_at,
          expiresAt: d.expires_at,
          used: d.used,
          usedBy: d.used_by,
        }));
        setDemoLinks(formatted);
      }
      setIsLoading(false);
    }
    fetchLinks();
  }, []);

  const generateDemoLink = async () => {
    const code = `early_access_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("demo_links")
      .insert([
        { code, expires_at: expiresAt, used: false }
      ])
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
            <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 shadow-sm border-slate-200">
               <Download className="w-4 h-4 mr-2" /> Export CSV
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
                <span className="text-green-500 text-sm font-bold flex items-center">+12% <TrendingUp className="w-3 h-3 ml-1"/></span>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Total Subscriptions</h3>
              <div className="text-4xl font-black text-slate-900">4,209</div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full -z-10 opacity-50" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Activity className="w-5 h-5"/></div>
                <span className="text-green-500 text-sm font-bold flex items-center">+8% <TrendingUp className="w-3 h-3 ml-1"/></span>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Monthly Rec. Rev</h3>
              <div className="text-4xl font-black text-slate-900">$142.5k</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-full -z-10 opacity-50" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><MessageSquare className="w-5 h-5"/></div>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">AI Messages (30d)</h3>
              <div className="text-4xl font-black text-slate-900">18,492</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full -z-10 opacity-50" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Globe className="w-5 h-5"/></div>
              </div>
              <h3 className="text-slate-500 font-semibold text-sm mb-1 uppercase tracking-wide">Active Domains</h3>
              <div className="text-4xl font-black text-slate-900">4,150</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & AI + Early Access Row */}
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

          {/* Early Access Demo Links */}
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
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin mx-auto" />
                    </div>
                  ) : demoLinks.length === 0 ? (
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
            <Button variant="ghost" className="text-blue-600 font-semibold hover:bg-blue-50">View All <ChevronRight className="w-4 h-4 ml-1"/></Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-y border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Customer</th>
                    <th className="px-6 py-4 font-bold">Domain</th>
                    <th className="px-6 py-4 font-bold">Subscription</th>
                    <th className="px-6 py-4 font-bold">AI Posts (30d)</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {user.domain}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                          user.plan === 'Pro' ? 'bg-purple-100 text-purple-700' :
                          user.plan === 'Demo' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <div className="w-16 bg-slate-100 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(user.posts / (user.plan === 'Pro' ? 30 : user.plan === 'Demo' ? 5 : 10)) * 100}%` }} />
                           </div>
                           <span className="text-xs font-bold">{user.posts}/{user.plan === 'Pro' ? '30' : user.plan === 'Demo' ? '5' : '10'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex w-fit items-center gap-1.5 ${
                          user.status === 'Trial' ? 'bg-amber-100 text-amber-800' : 
                          user.status === 'Demo' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'Trial' ? 'bg-amber-500' : 
                            user.status === 'Demo' ? 'bg-purple-500' :
                            'bg-green-500'
                          }`} />
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
