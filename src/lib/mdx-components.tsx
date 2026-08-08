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

export const mdxComponents = {
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
    <article className="prose prose-lg prose-slate max-w-none">{children}</article>
  ),
};

export const SITE_URL_EXPORT = SITE_URL;
export const ROUTES_EXPORT = ROUTES;