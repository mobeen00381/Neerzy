'use client';

import { useState, useEffect, useRef, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { PLAN_LIMITS, getPlan, getRemainingDays, getCycleStartIso } from '@/lib/plans';
import { ReviewsManager } from '@/components/dashboard/ReviewsManager';
import { SocialContentStudio } from '@/components/dashboard/SocialContentStudio';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { parsePostContent, buildCleanPost } from '@/lib/post-parser';
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
  ChevronRight,
  Copy,
  Star,
  Share2,
  Cpu
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  image?: string | null;
  sender: 'user' | 'bot';
  timestamp: string;
  date?: string;
  status?: string;
  isVoice?: boolean;
  source?: 'webapp' | 'whatsapp';
  postReady?: boolean;
  gbpLink?: string;
  generatedText?: string;
}

// Helper function to render message content with clickable links
function renderMessageContent(text: string) {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  // Internal path pattern (e.g., /onboarding, /copy/...)
  const internalPathPattern = /(\/[a-zA-Z0-9\-\/]+)/g;
  
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let keyIndex = 0;
  
  // First, handle URLs
  const urlMatches = [...text.matchAll(urlPattern)];
  
  if (urlMatches.length === 0) {
    // No URLs, check for internal paths
    const pathMatches = [...text.matchAll(internalPathPattern)];
    if (pathMatches.length === 0) {
      return text;
    }
    
    // Process internal paths
    pathMatches.forEach((match) => {
      const path = match[1];
      const startIndex = match.index!;
      
      // Add text before the path
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex));
      }
      
      // Add the clickable path
      parts.push(
        <a 
          key={keyIndex++} 
          href={path} 
          className="text-emerald-600 hover:text-emerald-700 underline font-bold"
          target={path.startsWith('/copy/') || path.startsWith('/images/') ? '_blank' : undefined}
          rel="noopener noreferrer"
        >
          {path}
        </a>
      );
      
      lastIndex = startIndex + path.length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return <>{parts}</>;
  }
  
  // Process URLs
  urlMatches.forEach((match) => {
    const url = match[1];
    const startIndex = match.index!;
    
    // Add text before the URL
    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }
    
    // Add the clickable URL
    parts.push(
      <a 
        key={keyIndex++} 
        href={url} 
        className="text-emerald-600 hover:text-emerald-700 underline font-bold break-all"
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
    );
    
    lastIndex = startIndex + url.length;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return <>{parts}</>;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'post' | 'analytics' | 'account' | 'reviews' | 'social'>('post');
  
  // User & Business Profiles
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, daily: 0, reviewCount: 0 });
  
  // Review stats
  const [reviewStats, setReviewStats] = useState<{
    total_sent: number;
    total_received: number;
    sent_today: number;
    sent_this_month: number;
    received_this_month: number;
    conversion_rate: number;
  } | null>(null);
  const [reviewStatsLoading, setReviewStatsLoading] = useState(false);
  
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // PWA install prompt state
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleDownloadApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallOpen(true);
    }
  };

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

      // 1. Fetch user profile (safely wrap in case columns are missing or error out)
      let profileData = null;
      try {
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profileData = fetchedProfile;
      } catch (dbErr) {
        console.warn('⚠️ Could not load profiles table:', dbErr);
      }

      // Get phone number from DB profile, auth phone, or auth user metadata
      let phone = profileData?.phone || user?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number;

      // HEAL / AUTO-LINK: Link to the default/sandbox profile if user phone is not set
      if (!phone) {
        const { data: defaultBProfile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_phone', '+923006291617')
          .maybeSingle();

        if (defaultBProfile) {
          phone = '+923006291617';
          // Update user metadata (always works client-side)
          try {
            const { data: updateRes } = await supabase.auth.updateUser({
              data: {
                phone: '+923006291617',
                business_name: defaultBProfile.business_name,
                gbp_connected: true
              }
            });
            if (updateRes?.user) {
              setUser(updateRes.user);
            }
            console.log("🩹 Healed user metadata with fallback business phone link.");
          } catch (metaErr) {
            console.error('❌ Failed to update user metadata in healing:', metaErr);
          }

          // Try updating profiles table, but catch errors to prevent dashboard crash
          try {
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .update({
                phone: '+923006291617',
                business_name: defaultBProfile.business_name
              })
              .eq('id', user.id)
              .select()
              .single();
            if (updatedProfile) {
              profileData = updatedProfile;
            }
          } catch (dbErr) {
            console.warn('⚠️ profiles table update skipped in healing:', dbErr);
          }
        }
      }

      setProfile(profileData);

      // 30-day billing cycle anchor (plan_started_at || trial_started_at || created_at)
      const cycleStartIso = getCycleStartIso(profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at);

      setPhone(phone); // lift phone to component state for ReviewsManager

      // 2. Fetch business profile
      let bData = null;
      if (phone) {
        try {
          const res = await fetch(`/api/business-profile?phone=${encodeURIComponent(phone)}`);
          if (res.ok) {
            const json = await res.json();
            bData = json.data;
          }
        } catch (err) {
          console.error("Failed to fetch business profile from API:", err);
        }
        setBusinessProfile(bData);
      }

      // 3. Fetch user posts from posts (web simulator) and pending_posts (WhatsApp drafts)
      let whatsappPosts: any[] = [];
      if (phone) {
        try {
          const { data: wpData } = await supabase
            .from('pending_posts')
            .select('*')
            .eq('user_phone', phone)
            .order('created_at', { ascending: true });
          if (wpData) whatsappPosts = wpData;
        } catch (wpErr) {
          console.warn('⚠️ Could not load pending_posts:', wpErr);
        }
      }

      // 3b. Fetch review requests to show in chat history
      let reviewRequests: any[] = [];
      try {
        const { data: reviewData } = await supabase
          .from('review_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('sent_at', { ascending: true });
        if (reviewData) reviewRequests = reviewData;
      } catch (rrErr) {
        console.warn('⚠️ Could not load review_requests:', rrErr);
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Build GBP link for restoring bot replies
      const gbpLinkForReplies = bData?.google_place_id 
        ? `https://www.google.com/maps/place/?q=place_id:${bData.google_place_id}`
        : 'https://business.google.com/';

      const mappedWebMessages: any[] = [];
      (postsData || []).forEach((p: any) => {
        // User message (original description)
        mappedWebMessages.push({
          id: p.id,
          text: p.content ? p.content.replace(/<[^>]*>/g, '') : '', // strip HTML
          image: p.image_url,
          sender: 'user' as const,
          timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(p.created_at).toLocaleDateString(),
          created_at: new Date(p.created_at),
          status: p.status || 'published',
          source: 'webapp' as const
        });

        // Bot reply — restored from ai_reply column (persists across refreshes)
        if (p.ai_reply) {
          mappedWebMessages.push({
            id: `bot-${p.id}`,
            text: `✅ *Post Ready!*\n\n${p.ai_reply}`,
            sender: 'bot' as const,
            timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(p.created_at).toLocaleDateString(),
            created_at: new Date(new Date(p.created_at).getTime() + 1000), // 1s after user msg for correct sort order
            postReady: true,
            gbpLink: gbpLinkForReplies,
            generatedText: p.ai_reply,
          });
        }
      });

      const mappedWAMessages = whatsappPosts.map((p: any) => {
        const googlePost = p.google_post || '';
        const parsed = parsePostContent(googlePost);
        const headline = parsed.headline || p.customer_name || 'New Post';
        const body = parsed.body || p.voice_note || '';
        const cta = parsed.cta || '';
        const hashtags = parsed.hashtags || '';
        const fullText = buildCleanPost(headline, body, cta, hashtags);

        return {
          id: p.id,
          text: p.google_post ? fullText : `[Draft] Voice note: ${p.voice_note || 'Photo upload'}`,
          image: p.images?.[0] || null,
          sender: 'user' as const,
          timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(p.created_at).toLocaleDateString(),
          created_at: new Date(p.created_at),
          status: p.status || 'draft', // Preserve generated/published/draft
          source: 'whatsapp' as const
        };
      });

      // Map review requests as chat messages (they already persist in DB)
      const mappedReviewMessages = (reviewRequests || []).map((r: any) => {
        const customerName = r.customer_name || 'Customer';
        const customerPhone = r.customer_phone || '';
        return {
          id: `review-${r.id}`,
          text: r.status === 'review_received'
            ? `⭐ *Review received from ${customerName}!*`
            : `✅ *Review request sent to ${customerName}!* ⭐\n\n📱 Sent to: ${customerPhone}\n🔗 ${r.review_link}\n\n_Done! Workflow complete._ ✅`,
          sender: 'bot' as const,
          timestamp: new Date(r.sent_at || r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(r.sent_at || r.created_at).toLocaleDateString(),
          created_at: new Date(r.sent_at || r.created_at),
          status: 'published',
          source: 'webapp' as const
        };
      });

      const dbMessages = [...mappedWebMessages, ...mappedWAMessages, ...mappedReviewMessages].sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      );

      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Welcome to Neerzy! 🤖 I am your Google Business Profile assistant.

Here's how it works:
1. 📸 Send photos of your completed job
2. ✍️ Send a short description or voice note
3. 💚 Type *POST* to generate your GMB post
4. 📋 Copy the text & publish to Google

Try sending a photo or typing a description of a job you completed!`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([welcomeMessage, ...dbMessages]);

      // Calculate post counts directly from posts DB (web posts) + pending_posts (WhatsApp),
      // filtered to the current 30-day billing cycle so WhatsApp + dashboard usage count
      // together against the plan's per-month quota.
      const cycleStart = new Date(cycleStartIso);
      const totalPostCount = (postsData || []).filter((p: any) => new Date(p.created_at) >= cycleStart).length
        + (whatsappPosts || []).filter((p: any) => new Date(p.created_at) >= cycleStart).length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyPostCount = (postsData || []).filter((p: any) => new Date(p.created_at) >= today).length
        + (whatsappPosts || []).filter((p: any) => new Date(p.created_at) >= today).length;
      const reviewCount = (reviewRequests || []).filter((r: any) => new Date(r.sent_at || r.created_at) >= cycleStart).length;

      setStats({ total: totalPostCount, daily: dailyPostCount, reviewCount });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  // Fetch review stats when analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics' && user?.id) {
      const fetchReviewStats = async () => {
        setReviewStatsLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch(`/api/reviews/stats?user_id=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token || ''}`,
            },
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setReviewStats(result.data);
            }
          }
        } catch (err) {
          console.error('Failed to fetch review stats:', err);
        } finally {
          setReviewStatsLoading(false);
        }
      };
      fetchReviewStats();
    }
  }, [activeTab, user?.id]);

  // Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };

  // Connect to Google Business Profile simulation
  const triggerSync = async () => {
    if (!businessProfile?.google_place_id) {
      router.push('/onboarding');
      return;
    }
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

  // Image upload handler — adds directly to draftImages with confirmation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgData = reader.result as string;
        const newImages = [...draftImages, imgData];
        setDraftImages(newImages);

        // Show the image in chat immediately
        const imgMsg: Message = {
          id: `user-${Date.now()}`,
          text: '📸 Photo',
          image: imgData,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, imgMsg]);

        // Show confirmation
        const confirmMsg: Message = {
          id: `bot-${Date.now()}`,
          text: `✅ *Image received & saved!* 📸 (${newImages.length} photo${newImages.length !== 1 ? 's' : ''})\n\n_Send a short description of the job, then type *POST* to generate._`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, confirmMsg]);
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

  // Mic voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Could not access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const recorder = mediaRecorderRef.current;
      
      recorder.onstop = async () => {
        if (shouldSend) {
          setIsTranscribing(true);
          const durationString = `${Math.floor(recordDuration / 60)}:${(recordDuration % 60).toString().padStart(2, '0')}`;
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voicenote.webm');
            
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (data.text) {
              handleSendMessage(`🎙️ [Voice Note]: ${data.text}`, undefined, true);
            } else {
              handleSendMessage(`🎙️ Voice Message (${durationString})`, undefined, true);
            }
          } catch (err) {
            console.error("Transcription failed:", err);
            handleSendMessage(`🎙️ Voice Message (${durationString})`, undefined, true);
          } finally {
            setIsTranscribing(false);
          }
        }
      };
      
      recorder.stop();
      recorder.stream.getTracks().forEach(track => track.stop());
    } else {
      if (shouldSend) {
        const durationString = `${Math.floor(recordDuration / 60)}:${(recordDuration % 60).toString().padStart(2, '0')}`;
        handleSendMessage(`🎙️ Voice Message (${durationString})`, undefined, true);
      }
    }
    setRecordDuration(0);
  };

  // Draft state for POST workflow
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Customer state for review flow
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [postPublished, setPostPublished] = useState(false);

  // Check if text is a recognized command (POST, DONE, RESET)
  const isPostCommand = (text: string) => text.trim().toUpperCase() === 'POST';
  const isDoneCommand = (text: string) => text.trim().toUpperCase() === 'DONE';
  const isResetCommand = (text: string) => text.trim().toUpperCase() === 'RESET';

  // Check if text looks like name + phone number: "Mike +15552221617"
  const hasPhoneNumber = (text: string) => {
    return /(\+?\d{10,15})/.test(text);
  };

  // Check if text looks like irrelevant chatter (single words, etc.)
  const isIrrelevantChat = (text: string) => {
    const t = text.trim().toLowerCase();
    if (t.length < 3) return true;
    return false;
  };

  // Generate the post (called after POST command)
  const doGeneratePost = async () => {
    if (!user) return;
    if (isGenerating) return;

    // Must have at least an image to generate
    if (draftImages.length === 0) {
      const warnMsg: Message = {
        id: `warn-${Date.now()}`,
        text: '⚠️ *No photos found.*\n\nSend a photo first, then type *POST*.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, warnMsg]);
      return;
    }

    // Plan quota pre-check (client-side UX; /api/generate-post also enforces server-side)
    if (planLimits.totalPosts !== -1 && stats.total >= planLimits.totalPosts) {
      const limitMsg: Message = {
        id: `limit-${Date.now()}`,
        text: `⚠️ *Post limit reached.*\n\nYour ${plan} plan allows ${planLimits.totalPosts} posts total. Upgrade to continue posting.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, limitMsg]);
      return;
    }
    if (planLimits.dailyPosts > 0 && stats.daily >= planLimits.dailyPosts) {
      const limitMsg: Message = {
        id: `limit-${Date.now()}`,
        text: `⚠️ *Daily post limit reached.*\n\nYour ${plan} plan allows ${planLimits.dailyPosts} post${planLimits.dailyPosts !== 1 ? 's' : ''} per day. Try again tomorrow.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, limitMsg]);
      return;
    }

    setIsGenerating(true);

    const bizName = businessProfile?.business_name || profile?.business_name || user?.user_metadata?.business_name || 'My Business Listing';
    const gbpLink = businessProfile?.google_place_id
      ? `https://www.google.com/maps/place/?q=place_id:${businessProfile.google_place_id}`
      : 'https://business.google.com/';

    // Show thinking
    const thinkingMsg: Message = {
      id: `thinking-${Date.now()}`,
      text: '🔄 Neerzy AI is generating your post...',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const aiRes = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: draftDescription || 'Photo update',
          businessName: bizName,
          imageUrl: draftImages[0] || null,
          userId: user.id,
        }),
      });

      if (aiRes.status === 403) {
        const errData = await aiRes.json().catch(() => ({}));
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== thinkingMsg.id);
          const limitMsg: Message = {
            id: `limit-${Date.now()}`,
            text: `⚠️ ${errData.error || 'Plan limit reached.'}`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return [...filtered, limitMsg];
        });
        setIsGenerating(false);
        return;
      }

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.message || 'AI generation failed');
      }

      const aiData = await aiRes.json();

      // Save generated post ONLY after successful generation (blocked/failed attempts don't count)
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: draftDescription || 'Photo update',
          image_url: draftImages[0] || null,
          status: 'published',
          ai_reply: aiData.fullText,
        });

      if (error) {
        console.error('Failed to save post:', error);
        throw new Error('Failed to save post');
      }

      // Clear draft state
      setDraftImages([]);
      setDraftDescription('');

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMsg.id);
        const readyMsg: Message = {
          id: `ready-${Date.now()}`,
          text: `✅ *Post Ready!*\n\n${aiData.fullText}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          postReady: true,
          gbpLink,
          generatedText: aiData.fullText,
        };
        return [...filtered, readyMsg];
      });

      // Refresh dashboard data to update counts from DB
      await loadDashboardData();
    } catch (aiErr: any) {
      console.error('AI generation error:', aiErr);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMsg.id);
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          text: aiErr.message?.includes('description') 
            ? `⚠️ ${aiErr.message}`
            : '❌ Could not generate post. Please check your connection and try again.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return [...filtered, errMsg];
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Send message — follows strict POST workflow
  const handleSendMessage = async (text: string, imageBase64?: string, isVoice = false) => {
    const textContent = text.trim();
    if (!textContent && !imageBase64) return;
    if (!user) return;

    setInputValue('');
    setPendingImage(null);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Command: RESET — clear all drafts
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isResetCommand(textContent)) {
      setDraftImages([]);
      setDraftDescription('');
      const resetMsg: Message = {
        id: `reset-${Date.now()}`,
        text: '🗑️ *Draft cleared.*\n\nAll images and description have been reset. Start fresh by sending a photo.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, resetMsg]);
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Command: POST — generate post from accumulated drafts
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isPostCommand(textContent)) {
      const postMsg: Message = {
        id: `user-${Date.now()}`,
        text: 'POST',
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, postMsg]);

      await doGeneratePost();
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Command: DONE — publish post on GMB & send review request
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isDoneCommand(textContent)) {
      const doneMsg: Message = {
        id: `user-${Date.now()}`,
        text: 'DONE',
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, doneMsg]);

      // If customer details already saved → send the review request
      if (customerName && customerPhone) {
        const bizName = businessProfile?.business_name || profile?.business_name || user?.user_metadata?.business_name || 'My Business Listing';
        const reviewLink = businessProfile?.review_link || 
          (businessProfile?.google_place_id ? `https://search.google.com/local/writereview?placeid=${businessProfile.google_place_id}` : '');

        if (!reviewLink) {
          const noGbMsg: Message = {
            id: `bot-nogb-${Date.now()}`,
            text: '⚠️ *No Google Business Profile connected.*\n\nPlease connect your GBP first to send review requests.',
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, noGbMsg]);
          return;
        }

        // Send the review via API
        let reviewSent = false;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/reviews/send-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({
              to: customerPhone,
              review_link: reviewLink,
              trader_name: bizName,
              customer_name: customerName,
              user_id: user.id,
            }),
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to send review request');
          }
          reviewSent = true;
        } catch (err: any) {
          console.error('Failed to send review:', err);
          const errMsg: Message = {
            id: `bot-err-${Date.now()}`,
            text: `❌ *Failed to send review request: ${err.message || 'Unknown error'}*\n\nPlease try again or use the Reviews tab.`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errMsg]);
          return;
        }

        if (reviewSent) {
          // Show completion message
          const sentMsg: Message = {
            id: `bot-sent-${Date.now()}`,
            text: `✅ *Review request sent to ${customerName}!* ⭐\n\n📱 Sent to: ${customerPhone}\n🔗 ${reviewLink}\n\n_Done! Workflow complete._ ✅`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, sentMsg]);
        }

        // Reset customer state
        setCustomerName('');
        setCustomerPhone('');
        setPostPublished(false);

        // Refresh dashboard to update counts and show the new review request in chat
        await loadDashboardData();
        return;
      }

      // No customer info yet → show post published + ask for customer
      const postedMsg: Message = {
        id: `bot-posted-${Date.now()}`,
        text: '✅ *Post has been published on Google My Business!* 📍',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, postedMsg]);

      if (businessProfile?.review_link || businessProfile?.google_place_id) {
        const promptMsg: Message = {
          id: `bot-prompt-${Date.now()}`,
          text: `⭐ *Send a review request to your customer?*\n\nSend their name & number like:\n_Mike +15552221617_\n\nThen type *DONE* again to send.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, promptMsg]);
      } else {
        const noGbMsg: Message = {
          id: `bot-nogb-${Date.now()}`,
          text: '⚠️ *No Google Business Profile connected.*\n\nPlease connect your GBP first to send review requests.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, noGbMsg]);
      }
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Customer name + phone: "Mike +15552221617"
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (hasPhoneNumber(textContent)) {
      const phoneMatch = textContent.match(/(\+?\d{10,15})/);
      const name = phoneMatch ? textContent.replace(phoneMatch[1], '').trim() || 'Customer' : 'Customer';
      const phone = phoneMatch ? phoneMatch[1] : '';
      
      // Save customer state
      setCustomerName(name);
      setCustomerPhone(phone);
      
      const custMsg: Message = {
        id: `user-${Date.now()}`,
        text: textContent,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, custMsg]);

      const confirmMsg: Message = {
        id: `bot-cust-${Date.now()}`,
        text: `✅ *Customer details saved.*\n\n👤 ${name}\n📱 ${phone}\n\nType *DONE* to send the review link to ${name}.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmMsg]);
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Image: add to draft and confirm
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (imageBase64) {
      const newImages = [...draftImages, imageBase64];
      setDraftImages(newImages);

      const imgMsg: Message = {
        id: `user-${Date.now()}`,
        text: textContent || '📸 Photo',
        image: imageBase64,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, imgMsg]);

      const confirmMsg: Message = {
        id: `bot-${Date.now()}`,
        text: `✅ *Image received & saved!* 📸 (${newImages.length} photo${newImages.length !== 1 ? 's' : ''})\n\n_Send a short description of the job, then type *POST* to generate._`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmMsg]);
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Irrelevant chat: ignore (don't save, don't reply)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isIrrelevantChat(textContent)) {
      // Silently ignore — no message posted, no draft saved
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Text: save as draft description
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    setDraftDescription(textContent);

    const descMsg: Message = {
      id: `user-${Date.now()}`,
      text: textContent,
      sender: 'user',
      isVoice,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, descMsg]);

    if (draftImages.length > 0) {
      const confirmMsg: Message = {
        id: `bot-${Date.now()}`,
        text: `✅ *Description saved!* ✍️\n\nNow type *POST* to generate your GMB post with ${draftImages.length} photo${draftImages.length !== 1 ? 's' : ''} & description.\n\n_Type RESET to clear the draft._`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmMsg]);
    } else {
      const confirmMsg: Message = {
        id: `bot-${Date.now()}`,
        text: `✅ *Description saved!* ✍️\n\n_Send photos, then type *POST* to generate._\n\n_Type RESET to clear._`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmMsg]);
    }
  };

  // Helper values for plan, business details
  const bName = businessProfile?.business_name || profile?.business_name || user?.user_metadata?.business_name || profile?.company_name || 'My Business Listing';
  const bLocation = businessProfile?.address || 'Not connected';
  const ownerName = user?.user_metadata?.owner_name || user?.user_metadata?.full_name || 'Business Owner';
  
  const plan = profile?.selected_plan || user?.user_metadata?.selected_plan || 'free';
  const planLimits = getPlan(plan);
  
  // trial_started_at: prefer DB profile, fall back to user_metadata (set during onboarding),
  // then auth user creation date, then now() as last resort
  const trialStart = profile?.trial_started_at || profile?.created_at || user?.user_metadata?.trial_started_at || user?.created_at || new Date().toISOString();
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
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'reviews' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'social' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Social</span>
                <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full uppercase">Growth</span>
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
              href="https://wa.me/923206291617?text=Hi%20Neerzy!%20I%20want%20to%20connect%20my%20WhatsApp%20profile."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20ba56] transition-all shadow-sm shadow-[#25D366]/10 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              Connect with WhatsApp
            </a>
            <button
              onClick={handleDownloadApp}
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
              <span className="hidden sm:inline border-r border-slate-200 h-3" />
              <span className="flex items-center gap-0.5 text-amber-600" title="Review Requests">
                ⭐ {planLimits.totalReviewRequests === -1 ? 'Unlimited' : `${planLimits.totalReviewRequests} reviews`}
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
              onClick={() => setActiveTab('social')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-100/50 transition-all ${
                activeTab === 'social' 
                  ? 'bg-purple-50/55 border-l-4 border-purple-600' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 bg-purple-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">Social Content</span>
                  <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">Growth</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Facebook & Instagram posts</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 border-b border-slate-100/50 transition-all ${
                activeTab === 'reviews' 
                  ? 'bg-emerald-50/55 border-l-4 border-emerald-600' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 bg-amber-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">Review Requests</span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Send & track Google review requests</p>
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
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-sm text-slate-900">Account & Listing</span>
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Right pane: Tab Content */}
        <section className="flex-1 flex flex-col bg-[#efeae2] relative min-h-[calc(100vh-80px)] overflow-hidden">
          
          {/* TAB 1: POST (WHATSAPP CHAT DESIGN) */}
          {activeTab === 'post' && (
            <div className="flex-1 flex flex-col h-full relative">
              
              {/* Removed: Backend status banner (Twilio/Model info) — not user-facing */}

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
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative group ${
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
                      <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed break-words">
                        {renderMessageContent(msg.text)}
                      </p>

                      {/* Inline action buttons when post is ready */}
                      {msg.postReady && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => {
                              const textToCopy = msg.generatedText || msg.text.replace(/^✅ \*Post Ready!\*\n\n/, '');
                              navigator.clipboard.writeText(textToCopy);
                              alert('Post copied to clipboard!');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Post
                          </button>
                          {msg.gbpLink && (
                            <a
                              href={msg.gbpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                            >
                              🌐 Open GBP
                            </a>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Copy Button */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            alert('Copied to clipboard!');
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100 bg-white/50 px-2 py-1 rounded"
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wide ml-auto">
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
                          handleSendMessage(inputValue, pendingImage || undefined);
                        }
                      }}
                      disabled={isRecording || isTranscribing}
                      placeholder={isTranscribing ? "Transcribing voice note..." : isRecording ? "Recording voice message..." : "Type your Google Business post caption..."}
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
                  ) : isTranscribing ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0">
                      <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-500">Transcribing...</span>
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
                  {!isRecording && !isTranscribing && (
                    <button
                      onClick={() => handleSendMessage(inputValue, pendingImage || undefined)}
                      disabled={!inputValue.trim() && !pendingImage && draftImages.length === 0}
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
            <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-y-auto max-h-[calc(100vh-80px)]">
              <div className="max-w-5xl mx-auto">
                <AnalyticsPanel 
                  userId={user?.id || ''} 
                  userPlan={plan} 
                  reviewStats={reviewStats} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL CONTENT STUDIO */}
          {activeTab === 'social' && (
            <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-y-auto max-h-[calc(100vh-80px)]">
              <div className="max-w-5xl mx-auto">
                <SocialContentStudio
                  userPlan={plan}
                  businessName={bName}
                  businessCategory={businessProfile?.category || 'Local Service'}
                />
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-y-auto space-y-8 max-h-[calc(100vh-80px)]">
              <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Review Requests</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">Send Google review requests via WhatsApp and track responses</p>
                </div>
                <ReviewsManager userId={user?.id || ''} businessProfile={businessProfile} userPhone={phone} />
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT & LISTING */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Subscription Left</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{daysCountdown}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Posts Remaining</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{totalCountdown}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-[10px] uppercase">Daily Post Limit</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{dailyCountdown}</span>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="block text-amber-500 text-[10px] uppercase">Review Requests</span>
                        <span className="block text-slate-900 text-base font-black mt-1">{planLimits.totalReviewRequests === -1 ? 'Unlimited' : `${planLimits.totalReviewRequests} total`}</span>
                        <span className="block text-amber-600 text-[10px] font-bold mt-0.5">{planLimits.dailyReviewRequests === -1 ? 'Unlimited' : `${planLimits.dailyReviewRequests}/day`}</span>
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
