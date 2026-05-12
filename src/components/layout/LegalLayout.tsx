'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Section {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, lastUpdated, sections, children }: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0% -80% 0%' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-black text-[#0F5C4D] mb-6">{title}</h1>
          <p className="text-xl text-slate-600 mb-4">{subtitle}</p>
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Last Updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sticky Sidebar */}
          <aside className="lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">On this page</h4>
              <nav className="flex flex-col space-y-2">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className={`text-sm font-medium py-1 transition-all border-l-2 pl-4 ${
                      activeSection === section.id
                        ? 'border-[#0F5C4D] text-[#0F5C4D] font-bold'
                        : 'border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
              <div className="pt-8 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  Neerzy is an independent platform and is not affiliated with Google or WhatsApp.
                </p>
              </div>
            </div>
          </aside>

          {/* Body Text */}
          <main className="lg:w-3/4 max-w-3xl prose prose-slate prose-lg lg:prose-xl prose-headings:text-slate-900 prose-headings:font-black prose-a:text-[#0F5C4D] prose-a:font-bold prose-strong:text-slate-900">
            {children}
            
            <div className="mt-20 pt-12 border-t border-slate-100">
              <h3 className="text-2xl font-bold mb-4">Questions?</h3>
              <p className="text-slate-600">
                If you have any questions about these terms, please contact us at{' '}
                <a href="mailto:support@neerzy.com" className="text-[#0F5C4D] underline">support@neerzy.com</a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
