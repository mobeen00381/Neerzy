import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { mdxComponents, SITE_URL_EXPORT } from '@/lib/mdx-components';
import { getGuideBySlug, getAllSlugs } from '@/lib/mdx';
import { ROUTES } from '@/lib/routes';

// ---- Route Exclusions ----
// These folder-based routes exist and must NOT be shadowed by [slug].
// next-mdx-remote/rsc reads files at runtime — no build-time fs restriction.
const RESERVED_SLUGS = new Set([
  'about', 'action', 'admin', 'api', 'blog', 'checkout',
  'contact', 'cookies', 'copy', 'dashboard', 'demo',
  'gmb-audit-tool', 'gmb-report', 'images', 'login',
  'onboarding', 'pricing', 'privacy-policy', 'publish',
  'quick-post', 'signup', 'terms', 'whatsapp-demo',
  'favicon.ico', '_next',
]);

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (RESERVED_SLUGS.has(slug)) return {};
  
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  
  const { frontmatter } = guide;
  const PAGE_URL = `${SITE_URL_EXPORT}/${slug}`;

  return {
    title: frontmatter.title,
    description: frontmatter.meta_description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.meta_description,
      url: PAGE_URL,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.meta_description,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (RESERVED_SLUGS.has(slug)) notFound();
  
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  
  const { frontmatter, content } = guide;
  const PAGE_URL = `${SITE_URL_EXPORT}/${slug}`;
  
  // ---- Schema.org structured data ----
  const articleSchema = frontmatter.schemaArticle ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.schemaArticle,
    description: frontmatter.meta_description,
    author: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL_EXPORT },
    publisher: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL_EXPORT },
    datePublished: frontmatter.date,
    mainEntityOfPage: PAGE_URL,
  } : null;
  
  const faqSchema = frontmatter.schemaFaq ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: frontmatter.schemaFaq.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  } : null;
  
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL_EXPORT },
      { '@type': 'ListItem', position: 2, name: frontmatter.breadcrumbName || frontmatter.title, item: PAGE_URL },
    ],
  };
  
  // ---- Category guide links (hub-and-spoke) ----
  const categoryGuides = [
    { href: ROUTES.GUIDES.COMPLETENESS, label: 'Completeness Score Guide (25%)' },
    { href: ROUTES.GUIDES.REVIEWS, label: 'Reviews Score Guide (25%)' },
    { href: ROUTES.GUIDES.VISUAL, label: 'Visual Content Score Guide (20%)' },
    { href: ROUTES.GUIDES.ENGAGEMENT, label: 'Engagement & Activity Score Guide (15%)' },
    { href: ROUTES.GUIDES.LOCAL_SEO, label: 'Local SEO Optimization Guide (15%)' },
  ];
  
  
  return (
    <>
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20 font-sans text-gray-800">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#0F5132] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{frontmatter.breadcrumbName || frontmatter.title}</span>
        </nav>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          {frontmatter.title}
        </h1>
        
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
            },
          }}
        />
        
        {/* Hub-and-Spoke Internal Linking Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Continue Learning or Take Action</h3>
            <p className="mb-6 text-gray-700">This guide is part of the Neerzy SEO ecosystem. Every category guide below maps directly to one scored section of your free audit.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Understand Your Results</h4>
                <ul className="space-y-2">
                  <li><Link href="/understanding-your-gbp-audit-score" className="text-[#0F5132] hover:underline">Understanding Your Audit Score</Link></li>
                  <li><Link href="/improve-your-audit-score" className="text-[#0F5132] hover:underline">How to Improve Your Overall Score</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Category Guides</h4>
                <ul className="space-y-2">
                  {categoryGuides.map((g) => (
                    <li key={g.href}><Link href={g.href} className="text-[#0F5132] hover:underline">{g.label}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link href={ROUTES.AUDIT_TOOL} className="inline-block bg-[#22C55E] text-white font-bold py-4 px-10 rounded-lg hover:bg-[#16A34A] transition-colors text-lg">
                Run Your Free Audit Now →
              </Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-gray-400 text-center"><em>Neerzy is an independent platform and is not affiliated with, endorsed by, or a partner of Google or WhatsApp. Google Business Profile and WhatsApp are trademarks of their respective owners.</em></p>
        </footer>
        
      </main>
    </>
  );
}