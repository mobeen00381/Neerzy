'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const LOADING = (label: string) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600 font-semibold">{label}</p>
    </div>
  </div>
);

/**
 * Legacy duplicate report — retired.
 *
 * This page used to fetch /api/gmb/audit and render its own 5-question "health
 * score", which disagreed with the real audit and showed two dead buttons.
 * There is now exactly ONE report, so old links and bookmarks are forwarded to
 * /gmb-audit-tool/results instead of being shown a second, different number.
 */
function LegacyReportRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');

  useEffect(() => {
    const params = new URLSearchParams();
    if (placeId) params.set('placeId', placeId);
    if (businessName) params.set('name', businessName);
    const query = params.toString();
    router.replace(`/gmb-audit-tool/results${query ? `?${query}` : ''}`);
  }, [placeId, businessName, router]);

  return LOADING('Opening your audit report...');
}

export default function AuditReport() {
  return (
    <Suspense fallback={LOADING('Loading...')}>
      <LegacyReportRedirect />
    </Suspense>
  );
}
