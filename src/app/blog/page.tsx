import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES, SITE_URL } from '@/lib/routes';
import { getAllGuides } from '@/lib/mdx';
import type { GuideFrontmatter } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'Neerzy Blog: Local SEO, Google Business Profile & Reviews',
  description: 'Guides, tips, and strategies for local SEO, Google Business Profile optimization, and review management — built for local service businesses.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Neerzy Blog: Local SEO, Google Business Profile & Reviews',
    description: 'Guides, tips, and strategies for local SEO, Google Business Profile optimization, and review management.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

interface BlogPost {
  title: string;
  href: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  featured?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Slug → display mapping consistent with ROUTES where possible */
const SLUG_ALIASES: Record<string, string> = {
  'seo-for-plumbers': ROUTES.PILLAR,
  'seo-for-electricians': '/seo-for-electricians',
  'locksmith-seo': '/locksmith-seo',
  'completeness-score-guide': ROUTES.GUIDES.COMPLETENESS,
  'reviews-score-guide': ROUTES.GUIDES.REVIEWS,
  'visual-content-score-guide': ROUTES.GUIDES.VISUAL,
  'engagement-score-guide': ROUTES.GUIDES.ENGAGEMENT,
  'local-seo-optimization-score-guide': ROUTES.GUIDES.LOCAL_SEO,
  'understanding-your-gbp-audit-score': ROUTES.UNDERSTANDING_SCORE,
  'improve-your-audit-score': ROUTES.IMPROVE_SCORE,
};

function buildBlogPosts(): BlogPost[] {
  const guides = getAllGuides();
  return guides.map((g) => ({
    title: g.frontmatter.title,
    href: SLUG_ALIASES[g.slug] || `/${g.slug}`,
    excerpt: g.frontmatter.meta_description,
    category: g.frontmatter.category,
    readTime: g.frontmatter.readTime,
    date: formatDate(g.frontmatter.date),
    featured: g.frontmatter.featured || false,
  }));
}

const blogPosts = buildBlogPosts();

const categoryColors: Record<string, string> = {
  'Local SEO': 'bg-blue-100 text-blue-800',
  'GBP Audit': 'bg-emerald-100 text-emerald-800',
  'Reviews': 'bg-amber-100 text-amber-800',
};

function BlogCard({ post }: { post: BlogPost }) {
  const categoryColor = categoryColors[post.category] || 'bg-gray-100 text-gray-700';

  return (
    <article
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 overflow-hidden"
    >
      <div className="flex flex-col flex-1 p-6">
        {/* Category badge + meta */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
            {post.category}
          </span>
          <span className="text-xs text-gray-400">{post.date}</span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
          <Link href={post.href} className="no-underline text-inherit hover:text-blue-600">
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Read time + link */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{post.readTime}</span>
          <Link
            href={post.href}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
          >
            Read More
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const categoryColor = categoryColors[post.category] || 'bg-gray-100 text-gray-700';

  return (
    <article className="group relative rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-blue-300">
      {/* Featured badge */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Featured
        </span>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
            {post.category}
          </span>
          <span className="text-xs text-gray-400">{post.date}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={post.href} className="no-underline text-inherit hover:text-blue-600">
            {post.title}
          </Link>
        </h2>

        <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-3xl">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-400">{post.readTime}</span>
          <Link
            href={post.href}
            className="inline-flex items-center gap-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            Read the Guide
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const featuredPost = blogPosts.find((p) => p.featured);
  const regularPosts = blogPosts.filter((p) => !p.featured);

  const blogListingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Neerzy Blog',
    description: 'Guides, tips, and strategies for local SEO, Google Business Profile optimization, and review management.',
    url: `${SITE_URL}/blog`,
    publisher: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL },
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}${post.href}`,
      datePublished: post.date,
      publisher: { '@type': 'Organization', name: 'Neerzy', url: SITE_URL },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 font-sans text-gray-800">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Blog</span>
        </nav>

        {/* Hero */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Neerzy Blog: Local SEO, Google Business Profile & Reviews
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Practical guides and strategies for improving your local search visibility —
            written for busy local service business owners, not marketers.
          </p>
        </header>

        {/* Featured post */}
        {featuredPost && (
          <section className="mb-16">
            <FeaturedCard post={featuredPost} />
          </section>
        )}

        {/* All posts grid */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <BlogCard key={post.href} post={post} />
            ))}
          </div>
        </section>

        {/* Empty state fallback */}
        {regularPosts.length === 0 && (
          <section className="text-center py-16">
            <p className="text-gray-500 text-lg">More articles coming soon. Check back for new guides and strategies.</p>
          </section>
        )}
      </main>
    </>
  );
}