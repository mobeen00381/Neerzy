"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle2, MessageSquare, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { PRICING_PLANS, FAQ_ITEMS } from "@/lib/constants";
import { useState } from "react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-semibold text-slate-900 pr-8 group-hover:text-blue-600 transition-colors">
          {question}
        </span>
        <div className={`shrink-0 p-1 rounded-full transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="pb-5 pr-12 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="py-20 bg-slate-50 min-h-screen relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-slate-600">
            Start with a 30-day free trial on all plans. Only pay the $20/year domain registration fee today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
              <p className="text-slate-500 mb-6 min-h-[48px]">Perfect for local businesses getting started with SEO.</p>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-slate-900">$19.99</span>
                <span className="text-slate-500 ml-2">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {PRICING_PLANS.basic.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto bg-slate-50 border-t border-slate-100">
              <Link href="/onboarding?plan=basic">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg shadow-md">Get Started</Button>
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden relative flex flex-col transform md:-translate-y-4 z-10">
            <div className="bg-blue-500 py-2 text-center text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Best Value
            </div>
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <p className="text-slate-500 mb-6 min-h-[48px]">For businesses serious about dominating local search results.</p>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-slate-900">$39.99</span>
                <span className="text-slate-500 ml-2">/month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {PRICING_PLANS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 pt-0 mt-auto bg-slate-50 border-t border-slate-100">
              <Link href="/onboarding?plan=pro">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg shadow-md">Select Pro</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mt-24 max-w-3xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know before getting started.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 divide-y divide-slate-100">
            {FAQ_ITEMS.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
        
        {/* Contact */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <Button 
            variant="outline" 
            className="border-slate-300 font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-ai-chat"));
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" /> 
            Open AI Assistant Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
