'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function AuditReportContent() {
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (placeId) {
      fetchReport();
    }
  }, [placeId]);

  const fetchReport = async () => {
    const res = await fetch(`/api/gmb/audit?placeId=${placeId}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Generating audit report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{businessName}</h1>
        <p className="text-gray-600 mb-8">Google Business Profile Audit Report</p>

        {report && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{report.healthScore}/100</p>
                <p className="text-gray-600 font-semibold mt-1">Health Score</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">⭐ {report.rating}</p>
                <p className="text-gray-600 font-semibold mt-1">{report.reviewCount} Reviews</p>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{report.missingItems?.length || 0}</p>
                <p className="text-gray-600 font-semibold mt-1">Missing Items</p>
              </div>
            </div>

            {report.missingItems?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Missing Profile Elements:</h2>
                <ul className="space-y-2">
                  {report.missingItems.map((item: string) => (
                    <li key={item} className="flex items-center gap-2 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="capitalize">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                Generate AI Post
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Send Review Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditReport() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <AuditReportContent />
    </Suspense>
  );
}
