import React from 'react';

interface SchemaMarkupProps {
  type: 'Article' | 'FAQPage' | 'BreadcrumbList' | 'LocalBusiness' | 'Plumber' | 'Organization' | 'WebPage';
  data: Record<string, any>;
}

export function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
