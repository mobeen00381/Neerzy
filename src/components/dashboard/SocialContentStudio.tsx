'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Wand2, 
  ArrowRight,
  MessageSquare,
  Image as ImageIcon,
  Hash,
  FileText
} from 'lucide-react';

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

  const [generatedContent, setGeneratedContent] = useState({
    facebook: {
      postText: `We just completed a full system restoration for a customer at ${businessName}. Fast turnaround, transparent pricing, and 100% satisfaction guaranteed!\n\nNeed reliable ${businessCategory} services? Contact us today.`,
      hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #LocalBusiness #QualityService`
    },
    instagram: {
      caption: `Precision work by ${businessName}! We pride ourselves on clean craftsmanship and fast response times.\n\nTag a friend who needs top-rated ${businessCategory} help!`,
      hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #LocalServices #QualityCraftsmanship`
    }
  });

  const handleGenerate = () => {
    if (!jobTopic.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      setGeneratedContent({
        facebook: {
          postText: `Feature Update from ${businessName}!\n\n${jobTopic}\n\nWe deliver high-quality ${businessCategory} services built for long-lasting performance. Contact us today for a free consultation.`,
          hashtags: `#${businessName.replace(/\s+/g, '')} #${businessCategory.replace(/\s+/g, '')} #QualityService #LocalPros`
        },
        instagram: {
          caption: `Behind the scenes with ${businessName}!\n\n${jobTopic}\n\nLoved bringing this project to life. Drop a comment below or send us a message to get started on your project today.`,
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
    <div className="space-y-6">
      {/* Header Banner — using brand colors per design.md */}
      <div className="bg-[#0B3D2E] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Growth Plan Feature
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Social Content Studio</h2>
          <p className="text-white/70 text-sm mt-1 leading-relaxed max-w-xl">
            Generate Facebook posts and Instagram captions with targeted hashtags to extend your reach beyond Google.
          </p>
        </div>
      </div>

      {/* Plan Gating — using brand colors */}
      {!isGrowthOrAgency && (
        <div className="bg-[#F7F9F8] border border-[#E1E8E4] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#0F5132]/10 text-[#0F5132] rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">Unlock Social Content Generation</span>
                <h3 className="text-base font-bold text-[#0A2E22] mt-1">Upgrade to Neerzy Growth ($79/mo)</h3>
                <p className="text-xs text-[#5B6B64] mt-1 max-w-xl">
                  Social Content Studio generates Facebook and Instagram captions, hashtag sets, and multi-platform content directly from your job details.
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-5 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs rounded-full flex items-center gap-2 active:scale-95 shrink-0 transition-all"
            >
              <span>Upgrade to Growth Tier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Studio Workspace */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${!isGrowthOrAgency ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Column: Generator Inputs */}
        <div className="lg:col-span-5 bg-[#F7F9F8] p-5 rounded-2xl border border-[#E1E8E4] space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E1E8E4]">
            <div className="w-9 h-9 bg-[#0F5132]/10 text-[#0F5132] rounded-xl flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A2E22] text-sm">Content Generator</h3>
              <p className="text-xs text-[#5B6B64]">Define job topic and post style</p>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5B6B64] uppercase tracking-wider">Post Style</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {[
                { id: 'showcase', label: 'Job Showcase', icon: FileText },
                { id: 'before_after', label: 'Before & After', icon: ImageIcon },
                { id: 'offer', label: 'Special Offer', icon: Sparkles },
                { id: 'review', label: 'Review Highlight', icon: MessageSquare }
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => setContentType(style.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    contentType === style.id 
                      ? 'border-[#22C55E] bg-[#22C55E]/5 text-[#0A2E22] font-bold' 
                      : 'border-[#E1E8E4] hover:border-[#D3E6DA] text-[#5B6B64] bg-white'
                  }`}
                >
                  <style.icon className="w-4 h-4" />
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Text Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5B6B64] uppercase tracking-wider">Job Details</label>
            <textarea
              rows={4}
              value={jobTopic}
              onChange={(e) => setJobTopic(e.target.value)}
              placeholder="e.g., Fixed leaky kitchen sink, replaced copper piping, and installed new faucet in Downtown area."
              className="w-full bg-white border border-[#E1E8E4] rounded-xl p-4 text-sm text-[#0A2E22] outline-none focus:border-[#22C55E] transition-all resize-none"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !jobTopic.trim()}
            className="w-full py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin" />
                <span>Generating Social Posts...</span>
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
        <div className="lg:col-span-7 bg-[#F7F9F8] p-5 rounded-2xl border border-[#E1E8E4] space-y-5">
          
          <div>
            {/* Platform Selector Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[#E1E8E4]">
                <button
                  onClick={() => setActivePlatform('facebook')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activePlatform === 'facebook'
                      ? 'bg-[#0F5132] text-white'
                      : 'text-[#5B6B64] hover:text-[#0A2E22]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Facebook Post
                </button>

                <button
                  onClick={() => setActivePlatform('instagram')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activePlatform === 'instagram'
                      ? 'bg-[#0F5132] text-white'
                      : 'text-[#5B6B64] hover:text-[#0A2E22]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Instagram Caption
                </button>
              </div>

              <span className="text-xs text-[#22C55E] font-bold">
                ● Ready to Share
              </span>
            </div>

            {/* Generated Output Card */}
            {activePlatform === 'facebook' ? (
              <div className="mt-4 space-y-3">
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E4] relative group">
                  <span className="text-xs font-bold text-[#0F5132] block mb-2">Facebook Caption</span>
                  <p className="text-sm text-[#0A2E22] whitespace-pre-wrap leading-relaxed">
                    {generatedContent.facebook.postText}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.facebook.postText, 'fb_text')}
                    className="absolute top-3 right-3 px-2.5 py-1.5 bg-white border border-[#E1E8E4] rounded-lg text-xs font-bold text-[#5B6B64] hover:text-[#0F5132] flex items-center gap-1 transition-all"
                  >
                    {copiedField === 'fb_text' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'fb_text' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E1E8E4] relative group">
                  <span className="text-xs font-bold text-[#0F5132] block mb-2">Recommended Hashtags</span>
                  <p className="text-sm text-[#0A2E22] leading-relaxed">
                    {generatedContent.facebook.hashtags}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.facebook.hashtags, 'fb_tags')}
                    className="absolute top-3 right-3 px-2.5 py-1.5 bg-white border border-[#E1E8E4] rounded-lg text-xs font-bold text-[#5B6B64] hover:text-[#0F5132] flex items-center gap-1 transition-all"
                  >
                    {copiedField === 'fb_tags' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'fb_tags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E4] relative group">
                  <span className="text-xs font-bold text-[#0F5132] block mb-2">Instagram Caption</span>
                  <p className="text-sm text-[#0A2E22] whitespace-pre-wrap leading-relaxed">
                    {generatedContent.instagram.caption}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.instagram.caption, 'ig_text')}
                    className="absolute top-3 right-3 px-2.5 py-1.5 bg-white border border-[#E1E8E4] rounded-lg text-xs font-bold text-[#5B6B64] hover:text-[#0F5132] flex items-center gap-1 transition-all"
                  >
                    {copiedField === 'ig_text' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'ig_text' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E1E8E4] relative group">
                  <span className="text-xs font-bold text-[#0F5132] block mb-2">Targeted Local Hashtags</span>
                  <p className="text-sm text-[#0A2E22] leading-relaxed">
                    {generatedContent.instagram.hashtags}
                  </p>
                  <button
                    onClick={() => handleCopy(generatedContent.instagram.hashtags, 'ig_tags')}
                    className="absolute top-3 right-3 px-2.5 py-1.5 bg-white border border-[#E1E8E4] rounded-lg text-xs font-bold text-[#5B6B64] hover:text-[#0F5132] flex items-center gap-1 transition-all"
                  >
                    {copiedField === 'ig_tags' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'ig_tags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E1E8E4] text-xs text-[#5B6B64]">
            <span>Tip: Copy formatting directly into Meta Business Suite or mobile Instagram app.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
