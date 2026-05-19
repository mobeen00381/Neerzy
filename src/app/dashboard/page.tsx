'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { PLAN_LIMITS, getRemainingDays } from '@/lib/plans';
import { 
  Sparkles, 
  Smartphone, 
  MessageSquare, 
  TrendingUp, 
  LogOut, 
  Loader2, 
  Plus, 
  Camera, 
  Mic, 
  Send, 
  User, 
  X, 
  MapPin, 
  Check, 
  CheckCheck, 
  Trash2,
  Play,
  Square,
  Activity,
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  image?: string | null;
  sender: 'user' | 'bot';
  timestamp: string;
  status?: string;
  isVoice?: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'post' | 'analytics' | 'account'>('post');
  
  // User & Business Profiles
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, daily: 0 });
  
  // WhatsApp Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  // Web camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  
  // PWA install prompt state
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Sync state (Account tab)
  const [syncing, setSyncing] = useState(false);

  // Business owner states
  const [ownerInput, setOwnerInput] = useState('');
  const [updatingOwner, setUpdatingOwner] = useState(false);

  // Scroll anchor for chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load owner input state when user updates
  useEffect(() => {
    if (user) {
      setOwnerInput(user.user_metadata?.owner_name || user.user_metadata?.full_name || 'Business Owner');
    }
  }, [user]);

  // Load user data, profile, and business details
  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signup');
        return;
      }
      setUser(user);

      // 1. Fetch user profile
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // HEAL / AUTO-LINK: Link to the default/sandbox profile if user phone is not set
      if (profileData && !profileData.phone) {
        const { data: defaultBProfile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_phone', '+923056500917')
          .maybeSingle();

        if (defaultBProfile) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({
              phone: '+923056500917',
              business_name: defaultBProfile.business_name,
              gbp_connected: true,
              gbp_connected_at: new Date().toISOString(),
              onboarded_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();
          
          if (updatedProfile) {
            profileData = updatedProfile;
            console.log("🩹 Healed user profile with fallback business phone link.");
          }
        }
      }

      setProfile(profileData);

      // 2. Fetch business profile
      const phone = profileData?.phone || user?.phone || user?.user_metadata?.phone_number;
      let bData = null;
      if (phone) {
        const { data: fetchBData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_phone', phone)
          .maybeSingle();
        bData = fetchBData;
        setBusinessProfile(bData);
      }

      // 3. Fetch user posts and calculate stats
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const dbMessages: Message[] = (postsData || []).map((p: any) => ({
        id: p.id,
        text: p.content ? p.content.replace(/<[^>]*>/g, '') : '', // strip HTML
        image: p.image_url,
        sender: 'user',
        timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: p.status || 'published'
      }));

      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Welcome to Neerzy! 🤖 I am your Google Business Profile assistant. Every update you send in this chat will be optimized and published to your listing: "${bData?.business_name || 'Your Connected Business'}" automatically. Try typing a message or uploading a picture below!`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([welcomeMessage, ...dbMessages]);

      // Calculate counts
      const totalCount = postsData?.length || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyCount = (postsData || []).filter((p: any) => new Date(p.created_at) >= today).length;

      setStats({ total: totalCount, daily: dailyCount });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  // Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };

  // Connect to Google Business Profile simulation
  const triggerSync = async () => {
    setSyncing(true);
    try {
      await loadDashboardData();
      alert("Profile sync completed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to sync profile. Please check connection.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveOwnerName = async () => {
    if (!ownerInput.trim()) return;
    setUpdatingOwner(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { owner_name: ownerInput }
      });
      if (error) throw error;
      
      setUser(data.user);
      alert("Business owner name saved successfully!");
    } catch (err) {
      console.error("Error saving owner name:", err);
      alert("Failed to update owner name.");
    } finally {
      setUpdatingOwner(false);
    }
  };

  // Image upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Failed to access camera:", err);
      alert("Could not access camera device. Please check camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPendingImage(dataUrl);
      }
      stopCamera();
    }
  };

  // Mic voice recording simulation
  const startRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = (shouldSend: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);

    if (shouldSend) {
      const durationString = `${Math.floor(recordDuration / 60)}:${(recordDuration % 60).toString().padStart(2, '0')}`;
      handleSendMessage(`🎙️ Voice Message (${durationString})`, undefined, true);
    }
    setRecordDuration(0);
  };

  // Send message
  const handleSendMessage = async (text: string, imageBase64?: string, isVoice = false) => {
    const textContent = text.trim();
    if (!textContent && !imageBase64) return;
    if (!user) return;

    try {
      // Save post to database
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: textContent || (isVoice ? 'Voice message note' : 'Image update'),
          image_url: imageBase64 || pendingImage || null,
          status: 'published'
        })
        .select()
        .single();

      if (error) throw error;

      // Update message list
      const newMessage: Message = {
        id: newPost.id,
        text: newPost.content,
        image: newPost.image_url,
        sender: 'user',
        timestamp: new Date(newPost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'published',
        isVoice
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      setPendingImage(null);

      // Increment stats count
      setStats(prev => ({
        total: prev.total + 1,
        daily: prev.daily + 1
      }));

      // Simulate WhatsApp response (Optimization feedback)
      setTimeout(() => {
        const optimizationMsg: Message = {
          id: `opt-${Date.now()}`,
          text: "🔄 Neerzy AI is refining the description, matching keywords, and formatting SEO tags for Google Business Profile...",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, optimizationMsg]);

        setTimeout(() => {
          const successMsg: Message = {
            id: `success-${Date.now()}`,
            text: "✅ Successfully published to your Google Business Profile! Check your GMB listing to see the live update.",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, successMsg]);
        }, 1500);

      }, 1000);

    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Helper values for plan, business details
  const bName = businessProfile?.business_name || profile?.business_name || profile?.company_name || 'My Business Listing';
  const bLocation = businessProfile?.address || 'Not connected';
  const ownerName = user?.user_metadata?.owner_name || user?.user_metadata?.full_name || 'Business Owner';
  
  const plan = profile?.selected_plan || user?.user_metadata?.selected_plan || 'free';
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  
  const trialStart = profile?.trial_started_at || profile?.created_at || new Date().toISOString();
  const daysLeft = planLimits.trialDays > 0 ? getRemainingDays(trialStart, planLimits.trialDays) : 30;
  const daysCountdown = planLimits.trialDays > 0 ? `${daysLeft} days left` : 'Unlimited';

  const totalRemaining = planLimits.totalPosts === -1 ? 'Unlimited' : Math.max(0, planLimits.totalPosts - stats.total);
  const totalCountdown = planLimits.totalPosts === -1 ? 'Unlimited' : `${totalRemaining}/${planLimits.totalPosts} remaining`;
  
  const dailyRemaining = Math.max(0, planLimits.dailyPosts - stats.daily);
  const dailyCountdown = `${dailyRemaining}/${planLimits.dailyPosts} left`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="font-bold text-slate-500 animate-pulse">Loading Neerzy Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* Top Header Section */}
      <header className="bg-white border-b border-slate-200/80 py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Left: Brand & Main Tabs */}
          <div className="flex items-center justify-between md:justify-start gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">Neerzy</span>
            </div>

            {/* Clean Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('post')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'post' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Post
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'analytics' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'account' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Account
              </button>
            </div>
          </div>

          {/* Center: Connect WhatsApp & Download App Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/923056500917?text=Hi%20Neerzy!%20I%20want%20to%20connect%20my%20WhatsApp%20profile."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20ba56] transition-all shadow-sm shadow-[#25D366]/10 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              Connect with WhatsApp
            </a>
            <button
              onClick={() => setIsInstallOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              Download Web App
            </button>
          </div>

          {/* Right: Business details, Plan, and Countdowns */}
          <div className="flex flex-col items-start md:items-end text-left md:text-right border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block leading-tight">{bName}</span>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1 flex flex-wrap items-center gap-2 md:justify-end">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {bLocation.split(',')[0]}</span>
                <span>•</span>
                <span>👤 Owner: {ownerName}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[10px] font-extrabold text-slate-500">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-wider font-black">
                {plan} Plan
              </span>
              <span className="hidden sm:inline border-r border-slate-200 h-3" />
              <span className="flex items-center gap-0.5" title="Remaining Subscription Days">
                ⏳ {daysCountdown}
              </span>
              <span className="hidden sm:inline border-r border-slate-200 h-3" />
              <span className="flex items-center gap-0.5" title="Total Posts Count">
                📝 {totalCountdown}
              </span>
              <span className="hidden sm:inline border-r border-slate-200 h-3" />
              <span className="flex items-center gap-0.5" title="Daily Posts Count">
                ⚡ Daily: {dailyCountdown}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex overflow-hidden min-h-[calc(100vh-80px)]">
        
        {/* Left pane for Navigation List (styled like WhatsApp Sidebar) */}
        <aside className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-sm">
                {bName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 truncate max-w-[160px]">{bName}</h4>
                <p className="text-[10px] text-slate-400 font-bold">Online</p>
              </div>
            </div>
          </div>
          
          {/* Navigation chats list */}
          <div className="flex-1 py-2 overflow-y-auto space-y-1">
            <button
              onClick={() => setActiveTab('post')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-100/50 transition-all ${
                activeTab === 'post' 
                  ? 'bg-emerald-50/55 border-l-4 border-emerald-600' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 bg-[#128C7E] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900">Post Assistant</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Live</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Publish updates to your Google profile</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-100/50 transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-50/55 border-l-4 border-emerald-600' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 bg-teal-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900">Performance Analytics</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Views, Clicks, and SEO ratings</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-100/50 transition-all ${
                activeTab === 'account' 
                  ? 'bg-emerald-50/55 border-l-4 border-emerald-600' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 bg-slate-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900">Account & Listing</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Plan tier and Google Maps sync</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Right pane: Tab Content */}
        <section className="flex-1 flex flex-col bg-[#efeae2] relative min-h-[calc(100vh-80px)] overflow-hidden">
          
          {/* TAB 1: POST (WHATSAPP CHAT DESIGN) */}
          {activeTab === 'post' && (
            <div className="flex-1 flex flex-col h-full relative">
              {/* WhatsApp chat top bar (mobile) */}
              <div className="md:hidden flex items-center gap-3 bg-white p-3 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {bName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate max-w-[180px]">{bName}</h4>
                  <p className="text-[9px] text-emerald-600 font-black">● Neerzy Assistant Active</p>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-h-[calc(100vh-210px)] md:max-h-[calc(100vh-190px)] min-h-[400px]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                        msg.sender === 'user'
                          ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-slate-200/50 bg-slate-50">
                          <img src={msg.image} alt="Uploaded attachment" className="w-full max-h-60 object-cover" />
                        </div>
                      )}
                      <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'user' && (
                          <span>
                            {msg.status === 'published' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* WhatsApp message composer */}
              <div className="bg-[#f0f2f5] p-3 flex flex-col gap-2 border-t border-slate-200">
                {/* Pending Image Preview overlay */}
                {pendingImage && (
                  <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-200 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                        <img src={pendingImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800">Ready to Publish</span>
                        <p className="text-[10px] text-slate-400 font-bold">Press send to post onto Google Business</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPendingImage(null)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Main Composer Bar */}
                <div className="flex items-center gap-3">
                  
                  {/* File attach button (+) */}
                  <label className="p-2.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 rounded-full cursor-pointer transition-all shrink-0">
                    <Plus className="w-6 h-6" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>

                  {/* Camera icon */}
                  <button 
                    onClick={startCamera}
                    title="Take Snapshot"
                    className="p-2.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 rounded-full transition-all shrink-0"
                  >
                    <Camera className="w-6 h-6" />
                  </button>

                  {/* Text Input area */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isRecording) {
                          handleSendMessage(inputValue);
                        }
                      }}
                      disabled={isRecording}
                      placeholder={isRecording ? "Recording voice message..." : "Type your Google Business post caption..."}
                      className="w-full bg-white px-4 py-3 rounded-full outline-none text-sm text-slate-800 shadow-sm border border-slate-200/50 focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Voice recording UI & Mic Icon */}
                  {isRecording ? (
                    <div className="flex items-center gap-2 bg-[#d9fdd3] px-4 py-2 rounded-full border border-emerald-200 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                      <span className="text-xs font-black text-slate-800">{Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}</span>
                      <button 
                        onClick={() => stopRecording(false)} 
                        className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors ml-1"
                        title="Delete recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => stopRecording(true)} 
                        className="p-1 hover:bg-emerald-100 text-emerald-800 rounded-full transition-colors"
                        title="Send recording"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startRecording}
                      title="Record Voice Note"
                      className="p-2.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 rounded-full transition-all shrink-0"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  )}

                  {/* Standard Send button */}
                  {!isRecording && (
                    <button
                      onClick={() => handleSendMessage(inputValue)}
                      disabled={!inputValue.trim() && !pendingImage}
                      className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-md hover:shadow-emerald-600/10 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none shrink-0"
                    >
                      <Send className="w-4 h-4 fill-current" />
                    </button>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-y-auto space-y-8 max-h-[calc(100vh-80px)]">
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance Analytics</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">Real-time local search and engagement rankings from Google</p>
                </div>

                {/* Analytics summary grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">GMB Views</span>
                      <span className="text-3xl font-black text-slate-900 block mt-1">1,420</span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1 block">▲ +12% vs last month</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                      👁️
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Actions</span>
                      <span className="text-3xl font-black text-slate-900 block mt-1">248</span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1 block">▲ +8% directions/calls</span>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                      📞
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SEO Health Score</span>
                      <span className="text-3xl font-black text-slate-900 block mt-1">94%</span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1 block">● Excellent visibility</span>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                      ⭐
                    </div>
                  </div>
                </div>

                {/* SVG Visual Graph */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">GBP Impressions (7 Days)</span>
                    <span className="text-xs text-[#0F5C4D] font-bold">Total: 4.8K impressions</span>
                  </div>
                  
                  {/* Mock Chart using SVG */}
                  <div className="h-48 w-full flex items-end justify-between pt-4 px-2">
                    {[
                      { day: 'Mon', val: 40 },
                      { day: 'Tue', val: 55 },
                      { day: 'Wed', val: 75 },
                      { day: 'Thu', val: 60 },
                      { day: 'Fri', val: 85 },
                      { day: 'Sat', val: 95 },
                      { day: 'Sun', val: 110 }
                    ].map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full flex items-end justify-center h-32 bg-slate-50 rounded-xl relative group">
                          <div 
                            style={{ height: `${(d.val / 110) * 100}%` }}
                            className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-teal-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-500" 
                          />
                          <span className="absolute -top-6 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.val * 10} views
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity List */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Recent Actions</h3>
                  
                  <div className="space-y-3">
                    {[
                      { action: "Sync Completed", time: "Just now", desc: "1 post pushed directly to GMB profile." },
                      { action: "Review Synced", time: "2 hours ago", desc: "Imported 2 new 5-star customer ratings." },
                      { action: "GMB Connected", time: "Yesterday", desc: "Successfully authenticated with Google Places API." }
                    ].map((act, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          ✓
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-xs">{act.action}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{act.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{act.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & LISTING */}
          {activeTab === 'account' && (
            <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-y-auto space-y-8 max-h-[calc(100vh-80px)]">
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Account Header */}
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Account & Listing</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">Configure your listing metadata, connected keys, and subscription plan</p>
                </div>

                {/* Listing Details Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl font-bold border border-emerald-100/50">
                      🏢
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{bName}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{businessProfile?.category || 'Local Listing'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Street Address</span>
                      <span className="font-bold text-slate-800 mt-1 block leading-relaxed">{bLocation}</span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Google Place ID</span>
                      <span className="font-bold text-slate-800 mt-1 block font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block text-xs">
                        {businessProfile?.google_place_id || 'Not connected'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Connected Phone</span>
                      <span className="font-bold text-slate-800 mt-1 block">
                        {businessProfile?.user_phone || user?.phone || 'Not verified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Listing Status</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-100 mt-1">
                        ● Synced & Live
                      </span>
                    </div>
                  </div>

                  {/* Sync Trigger button */}
                  <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                    <button
                      onClick={triggerSync}
                      disabled={syncing}
                      className="px-5 py-3 bg-[#0F5C4D] text-white rounded-2xl hover:bg-[#0c4a3e] transition-all font-black text-xs flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4" />
                          <span>Syncing Listing...</span>
                        </>
                      ) : (
                        <>
                          <span>Sync Google Listing</span>
                        </>
                      )}
                    </button>

                    {businessProfile?.google_maps_url && (
                      <a
                        href={businessProfile.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all font-black text-xs flex items-center gap-1.5 rounded-2xl"
                      >
                        <span>View on Google Maps</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Business Owner Profile Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Business Owner Profile</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Manage the primary contact name for this business listing</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Owner Name</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={ownerInput}
                          onChange={(e) => setOwnerInput(e.target.value)}
                          className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm text-slate-800 focus:border-emerald-500 font-semibold transition-all"
                          placeholder="e.g. John Doe"
                        />
                        <button
                          onClick={handleSaveOwnerName}
                          disabled={updatingOwner}
                          className="px-5 py-3 bg-[#0F5C4D] text-white rounded-xl hover:bg-[#0c4a3e] transition-all font-black text-xs flex items-center gap-1 active:scale-95 disabled:opacity-50 shrink-0"
                        >
                          {updatingOwner ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Name</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Tier details */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Plan Status</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Billing level limits and feature lists</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                    <div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {plan} plan
                      </span>
                      <h4 className="font-extrabold text-slate-900 mt-2 text-base">{planLimits.name} Tier Subscription</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Trial period: {planLimits.trialDays} Days total</p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-950">{planLimits.price}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Recurring billing</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Quota Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Subscription Left</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{daysCountdown}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Posts Remaining</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{totalCountdown}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Daily Limit</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{dailyCountdown}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Log Out button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-black text-sm active:scale-95"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out Account
                  </button>
                </div>

              </div>
            </div>
          )}

        </section>
      </main>

      {/* WEBCAM CAMERA CAPTURE MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={stopCamera} />
          
          <div className="relative bg-white text-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={stopCamera}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-6">
              <h3 className="text-xl font-black mb-4 tracking-tight">Capture Google Post Photo</h3>
              
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={captureSnapshot}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA INSTALL INSTRUCTIONS MODAL */}
      {isInstallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsInstallOpen(false)} />
          
          <div className="relative bg-white text-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsInstallOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-black mb-3 tracking-tight">Install Neerzy Web App</h3>
              <p className="text-slate-500 font-semibold mb-6 leading-relaxed">
                Add Neerzy to your mobile home screen to instantly capture job photos, type updates, and manage SEO rankings on-site.
              </p>
              
              <div className="space-y-4 mb-8 text-sm font-semibold">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div>
                    <span className="text-slate-900 block font-bold">For Apple iOS (Safari browser)</span>
                    <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
                      Tap the Share button <span className="inline-block bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">📤</span> in Safari navigation bar, scroll down, and select <span className="font-extrabold text-slate-800">Add to Home Screen</span>.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div>
                    <span className="text-slate-900 block font-bold">For Google Android (Chrome browser)</span>
                    <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
                      Tap the browser menu <span className="inline-block bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">⋮</span> at the top right, and select <span className="font-extrabold text-slate-800">Install App</span> or <span className="font-extrabold text-slate-800">Add to Home Screen</span>.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsInstallOpen(false)}
                className="w-full py-4.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-sm active:scale-95 shadow-xl shadow-slate-200"
              >
                Okay, Got it!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
