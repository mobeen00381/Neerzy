import React from 'react';
import Link from 'next/link';
import { ROUTES, SITE_URL } from '@/lib/routes';
import { SchemaMarkup } from '@/components/seo-visuals/SchemaMarkup';

interface SeoGuideLayoutProps {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}

export function SeoGuideLayout({ title, description, path, children }: SeoGuideLayoutProps) {
  const url = `${SITE_URL}${path}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'SEO for Plumbers',
        item: `${SITE_URL}${ROUTES.PILLAR}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: url,
      },
    ],
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Neerzy',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20 font-sans text-gray-800">
      <SchemaMarkup type="BreadcrumbList" data={breadcrumbSchema} />
      <SchemaMarkup type="Organization" data={organizationSchema} />
      <SchemaMarkup type="WebPage" data={webPageSchema} />
      
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center space-x-2">
        <Link href={ROUTES.PILLAR} className="hover:text-blue-600 transition-colors">SEO for Plumbers</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>

      {/* Main Content */}
      <article className="prose prose-lg max-w-none text-gray-700">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          {title}
        </h1>
        {children}
      </article>

      {/* Standardized Internal Linking Footer (Hub & Spoke) */}
      <footer className="mt-16 pt-8 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Improve Your Local Visibility</h3>
          <p className="mb-6 text-gray-700">
            This guide is part of our complete ecosystem for plumbing SEO. Keep learning or take action immediately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Core Guides</h4>
              <ul className="space-y-2 text-blue-600">
                <li><Link href={ROUTES.PILLAR} className="hover:underline">SEO for Plumbers (The Complete Guide)</Link></li>
                <li><Link href={ROUTES.UNDERSTANDING_SCORE} className="hover:underline">Understanding Your Audit Score</Link></li>
                <li><Link href={ROUTES.IMPROVE_SCORE} className="hover:underline">How to Improve Your Overall Score</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Category Breakdowns</h4>
              <ul className="space-y-2 text-blue-600">
                <li><Link href={ROUTES.GUIDES.REVIEWS} className="hover:underline">Reviews Score Guide</Link></li>
                <li><Link href={ROUTES.GUIDES.COMPLETENESS} className="hover:underline">Completeness Score Guide</Link></li>
                <li><Link href={ROUTES.GUIDES.VISUAL} className="hover:underline">Visual Content Score Guide</Link></li>
                <li><Link href={ROUTES.GUIDES.ENGAGEMENT} className="hover:underline">Engagement & Activity Score Guide</Link></li>
                <li><Link href={ROUTES.GUIDES.LOCAL_SEO} className="hover:underline">Local SEO Optimization Guide</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link 
              href={ROUTES.AUDIT_TOOL}
              className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Your Free Audit Now
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
