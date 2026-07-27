'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Layers, 
  Image as ImageIcon, 
  Wand2, 
  TrendingUp, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface SocialContentStudioProps {
  userPlan?: string;
  businessName?: string;
  businessCategory?: string;
}

export function SocialContentStudio({
  userPlan = 'free',
  businessName = 'My Business',
  businessCategory = 'Local Service'
}: SocialContentStudioProps) {
  const isGrowthOrAgency = ['growth', 'agency'].includes(userPlan.toLowerCase());

  const [jobTopic, setJobTopic] = useState('');
  const [contentType, setContentType] = useState<'showcase' | 'before_after' | 'offer' | 'review'>('showcase');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generated content states (Pre-populated defaults or live generated)
  const [generatedContent, setGeneratedContent] = useState({
    facebook: {
      postText: `🚨 Emergency Boiler Repair in Action! 🔧\n\nOur team at ${businessName} just completed a full system restoration for a customer. Fast turnaround, transparent pricing, and 100% satisfaction guaranteed!\n\nNeed fast, reliable ${businessCategory} services? Send us a DM or call us today! 📞💥`,
      hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #LocalBusiness #EmergencyRepair #SatisfactionGuaranteed`
    },
    instagram: {
      caption: `Precision work by ${businessName}! ✨ Swipe to see the finished result from today's job site.\n\nWe pride ourselves on clean craftsmanship and fast response times. 🛠️💙\n\n📌 Tag a friend who needs top-rated ${businessCategory} help!`,
      hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #LocalServices #QualityCraftsmanship #CustomerFirst #WorkInAction`
    }
  });

  const handleGenerate = () => {
    if (!jobTopic.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      setGeneratedContent({
        facebook: {
          postText: `✨ Feature Update from ${businessName}!\n\n${jobTopic}\n\nWe deliver high-quality ${businessCategory} services built for long-lasting performance. Contact us today for a free consultation! 📞`,
          hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #QualityService #LocalPros`
        },
        instagram: {
          caption: `Behind the scenes with ${businessName}! 🛠️\n\n${jobTopic}\n\nLoved bringing this project to life. Drop a comment below or send us a message to get started on your project today! 🚀`,
          hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #LocalBusiness #ExpertServices #ProjectShowcase`
        }
      });
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-purple-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 backdrop-blur-md rounded-full text-purple-200 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Growth Plan Exclusive
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Social Content Studio</h2>
          <p className="text-purple-200 text-sm font-semibold mt-2 leading-relaxed">
            Auto-generate high-converting Facebook posts, Instagram captions, visual tags, and targeted hashtags to extend your reach beyond Google.
          </p>
        </div>
      </div>

      {/* Plan Gating Upgrade Prompt for Free & Pro Users */}
      {!isGrowthOrAgency && (
        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-600/10 text-purple-700 rounded-2xl flex items-center justify-center shrink-0 border border-purple-200">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black text-purple-800 uppercase tracking-wider">Unlock Social Content Generation</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Upgrade to Neerzy Growth ($79/mo)</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1 max-w-xl">
                  Social Content Studio generates Facebook & Instagram captions, hashtag sets, and multi-platform visual previews directly from your job photos and voice notes.
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/20 flex items-center gap-2 active:scale-95 shrink-0 transition-all"
            >
              <span>Upgrade to Growth Tier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Studio Workspace */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${!isGrowthOrAgency ? 'opacity-80 pointer-events-none' : ''}`}>
        
        {/* Left Column: Generator Inputs */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Content Generator</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Define job topic & post style</p>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Post Style</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { id: 'showcase', label: 'Job Showcase', emoji: '🔨' },
                { id: 'before_after', label: 'Before & After', emoji: '📸' },
                { id: 'offer', label: 'Special Offer', emoji: '⚡' },
                { id: 'review', label: 'Review Highlight', emoji: '⭐' }
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => setContentType(style.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    contentType === style.id 
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-extrabold shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <span>{style.emoji}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Text Box */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Job Details / Highlights</label>
            <textarea
              rows={4}
              value={jobTopic}
              onChange={(e) => setJobTopic(e.target.value)}
              placeholder="e.g., Fixed leaky kitchen sink, replaced copper piping, and installed new faucet in Downtown area."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !jobTopic.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-extrabold text-xs shadow-md hover:shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin" />
                <span>AI Generating Social Posts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Social Content</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Platform Preview & Output */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
          
          <div>
            {/* Platform Selector Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActivePlatform('facebook')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                    activePlatform === 'facebook'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FacebookIcon className="w-4 h-4" />
                  Facebook Post
                </button>

                <button
                  onClick={() => setActivePlatform('instagram')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                    activePlatform === 'instagram'
                      ? 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <InstagramIcon className="w-4 h-4" />
                  Instagram Caption
                </button>
              </div>

              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                ● Ready to Share
              </span>
            </div>

            {/* Generated Output Card */}
            {activePlatform === 'facebook' ? (
              <div className="mt-6 space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 relative group">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-2">Facebook Caption</span>
                  <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedContent.facebook.postText}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.facebook.postText, 'fb_text')}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedField === 'fb_text' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'fb_text' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 relative group">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block mb-2">Recommended Hashtags</span>
                  <p className="text-xs font-mono font-bold text-purple-700 leading-relaxed">
                    {generatedContent.facebook.hashtags}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.facebook.hashtags, 'fb_tags')}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 hover:text-purple-600 flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedField === 'fb_tags' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'fb_tags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 relative group">
                  <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider block mb-2">Instagram Caption</span>
                  <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedContent.instagram.caption}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.instagram.caption, 'ig_text')}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 hover:text-pink-600 flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedField === 'ig_text' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'ig_text' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 relative group">
                  <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider block mb-2">Targeted Local Hashtags</span>
                  <p className="text-xs font-mono font-bold text-pink-700 leading-relaxed">
                    {generatedContent.instagram.hashtags}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.instagram.hashtags, 'ig_tags')}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 hover:text-pink-600 flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedField === 'ig_tags' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'ig_tags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>💡 Tip: Copy formatting directly into Meta Business Suite or mobile Instagram app.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
