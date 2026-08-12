import React from 'react';
import Link from 'next/link';
import { SITE_URL, ROUTES } from '@/lib/routes';
import { CalloutBox } from '@/components/seo-visuals/CalloutBox';
import { Screenshot } from '@/components/seo-visuals/Screenshot';
import {
  SeoDiagram,
  FivePillarDiagram,
  FlowDiagram,
  HubAndSpokeDiagram,
  ComparisonCard,
  GridDiagram,
  ThreePillarDiagram,
  WeightChart,
  LocalPackDiagram,
  GeoGridDiagram,
  SiteArchitectureDiagram,
  TimelineDiagram,
  WireframeDiagram,
  GaugeDiagram,
  SchemaDiagram,
  AuditResultDiagram,
  CategoryScoreDiagram,
  AuditOverviewDiagram,
  RecommendationsDiagram,
  BeforeAfterDiagram,
  ProgressGraphDiagram,
  PriorityFlowDiagram,
  UrgencyTimelineDiagram,
  ImprovementTimelineDiagram,
} from '@/components/seo-visuals/SeoDiagram';

function Footnote({ id }: { id: number }) {
  return (
    <sup>
      <a href={`#source-${id}`} id={`fn-${id}`} className="text-blue-600 no-underline hover:underline">
        [{id}]
      </a>
    </sup>
  );
}

/* ---------- styled MDX headings: match the brand design system ---------- */
function MdxH1({ children }: { children?: React.ReactNode }) {
  return (
    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 mt-10 leading-tight tracking-tight">
      {children}
    </h1>
  );
}

function MdxH2({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] mt-12 mb-4 leading-tight tracking-tight border-b border-gray-200 pb-2">
      {children}
    </h2>
  );
}

function MdxH3({ children }: { children?: React.ReactNode }) {
  return (
    <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-3 leading-snug">
      {children}
    </h3>
  );
}

function MdxH4({ children }: { children?: React.ReactNode }) {
  return (
    <h4 className="text-xl font-semibold text-slate-700 mt-6 mb-2 leading-snug">
      {children}
    </h4>
  );
}

/* ---------- MDX table (remark-gfm outputs plain <table>) ---------- */
function MdxTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        {children}
      </table>
    </div>
  );
}

function MdxTh({ children }: { children?: React.ReactNode }) {
  return (
    <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-800">
      {children}
    </th>
  );
}

function MdxTd({ children }: { children?: React.ReactNode }) {
  return (
    <td className="border border-gray-300 px-4 py-2 text-gray-700 align-top">
      {children}
    </td>
  );
}

/* ---------- MDX li: handle remark-gfm checklist items ---------- */
function MdxLi({ className, children, ...props }: React.LiHTMLAttributes<HTMLLIElement> & { className?: string }) {
  const isTask = className?.includes('task-list-item');
  if (isTask) {
    return (
      <li className="flex items-start gap-2 my-1 ml-0 list-none" {...props}>
        {children}
      </li>
    );
  }
  return (
    <li className="my-1 ml-6 list-disc" {...props}>
      {children}
    </li>
  );
}

export const mdxComponents = {
  /* ---- explicit headings ---- */
  h1: MdxH1,
  h2: MdxH2,
  h3: MdxH3,
  h4: MdxH4,

  /* ---- tables (remark-gfm) ---- */
  table: MdxTable,
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-gray-100">{children}</thead>,
  th: MdxTh,
  td: MdxTd,
  tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-gray-200">{children}</tr>,

  /* ---- lists (remark-gfm checklists) ---- */
  li: MdxLi,
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, start, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 space-y-1 list-decimal pl-6" start={start} {...props}>{children}</ol>
  ),

  /* ---- block-level wrappers ---- */
  section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <section className="mt-8 pt-4 border-t border-gray-200" {...props}>{children}</section>
  ),
  hr: () => <hr className="my-10 border-gray-200" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-[#22C55E] bg-gray-50 px-6 py-4 my-6 rounded-r-lg italic text-gray-700">
      {children}
    </blockquote>
  ),

  /* ---- inline ---- */
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-gray-100 text-[#0F5132] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-gray-900 text-gray-100 p-5 rounded-lg overflow-x-auto my-6 text-sm leading-relaxed">{children}</pre>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-base text-gray-700 leading-relaxed my-4">{children}</p>
  ),

  // HTML equivalents
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { href, children, ...rest } = props;
    if (href && (href.startsWith('/') || href.startsWith('#'))) {
      return (
        <Link href={href} className="text-blue-600 hover:underline" {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },

  // Content components
  CalloutBox,
  Screenshot,
  SeoDiagram,
  FivePillarDiagram,
  FlowDiagram,
  HubAndSpokeDiagram,
  ComparisonCard,
  GridDiagram,
  ThreePillarDiagram,
  WeightChart,
  LocalPackDiagram,
  GeoGridDiagram,
  SiteArchitectureDiagram,
  TimelineDiagram,
  WireframeDiagram,
  GaugeDiagram,
  SchemaDiagram,
  AuditResultDiagram,
  CategoryScoreDiagram,
  AuditOverviewDiagram,
  RecommendationsDiagram,
  BeforeAfterDiagram,
  ProgressGraphDiagram,
  PriorityFlowDiagram,
  UrgencyTimelineDiagram,
  ImprovementTimelineDiagram,
  Footnote,
  Link,

  // Wrapper for standard prose layout
  wrapper: ({ children }: { children: React.ReactNode }) => (
    <article className="max-w-none">{children}</article>
  ),
};

export const SITE_URL_EXPORT = SITE_URL;
export const ROUTES_EXPORT = ROUTES;