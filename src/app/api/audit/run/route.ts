import { NextResponse } from 'next/server';
import { guardPublicRequest, DETAIL_LIMIT } from '@/lib/api-guard';
import {
  detailCacheKey,
  getCached,
  setCached,
  DETAIL_CACHE_MS,
  searchCacheKey,
  SEARCH_CACHE_MS,
} from '@/lib/places-cache';
import { captureAuditLead } from '@/lib/audit-lead';
import {
  buildAuditReport,
  tradeProfileFor,
  scanWebsite,
  teaseAuditReport,
  type AuditReport,
  type CompetitorSnapshot,
} from '@/lib/audit-engine';
import { verifyUnlockToken } from '@/lib/report-unlock';

/**
 * Full GBP audit for one listing (the call behind /gmb-audit-tool/results).
 *
 * Expensive tier: one Places details call per run, so it is guarded with
 * DETAIL_LIMIT (5/hour per IP, then a 1-hour block) instead of the generous
 * autocomplete limit. The finished audit is memoised for 10 minutes so a page
 * reload or a back-navigation doesn't cost a second Google call.
 */
const TOO_MANY_AUDITS =
  'Too many audits from this device — please try again later.';

/** Town/city from a formatted address: "..., Leeds LS17 5AQ, UK" -> "Leeds". */
function localityFromAddress(address?: string): string {
  const parts = String(address || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  const withoutCountry = parts.length > 1 ? parts.slice(0, -1) : parts;
  const candidate = withoutCountry[withoutCountry.length - 1] || '';
  return candidate
    .replace(/\b[A-Z]{1,2}\d[\dA-Z]?\s?\d[A-Z]{2}\b/gi, '')
    .replace(/\b\d{5}(-\d{4})?\b/g, '')
    .trim();
}

/**
 * Top-1 competitor + this listing's position, from Google's Text Search — the
 * same billable call /api/gmb/search already makes, cached 24h per identical
 * query. Deliberately non-fatal: if Google is slow or the query finds nothing,
 * the report simply renders without the battle table rather than failing.
 */
type CompetitorLookup = {
  competitor: CompetitorSnapshot | null;
  /** 1-based position of the audited listing in the returned results. */
  rank: number | null;
  /** How many results the search returned. */
  total: number | null;
};

async function fetchTopCompetitor(
  apiKey: string,
  placeId: string,
  query: string,
  location?: { latitude?: number; longitude?: number } | null
): Promise<CompetitorLookup> {
  const empty: CompetitorLookup = { competitor: null, rank: null, total: null };
  const textQuery = query.replace(/\s+/g, ' ').trim();
  if (textQuery.length < 3) return empty;

  const cacheKey = searchCacheKey(
    'audit:competitor',
    `${textQuery}:${location?.latitude ?? ''},${location?.longitude ?? ''}`
  );
  const cached = getCached<CompetitorLookup>(cacheKey);
  if (cached !== undefined) return cached;

  const body: Record<string, unknown> = { textQuery, maxResultCount: 5 };
  // Service-area businesses have no address, so bias by coordinates instead: a
  // ~10km circle keeps "nearest competitor" honest without a town name.
  if (typeof location?.latitude === 'number' && typeof location?.longitude === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius: 10000,
      },
    };
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.rating,places.userRatingCount,places.photos,places.types',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return empty;
    const data = await res.json();
    const places: any[] = Array.isArray(data?.places) ? data.places : [];
    if (places.length === 0) return empty;

    // Rank is where Google placed YOUR listing. The benchmark is measured
    // against the best-ranked OTHER business, so we never compare you to you.
    const selfIndex = places.findIndex((candidate) => candidate?.id === placeId);
    const match = places.find((candidate) => candidate?.id && candidate.id !== placeId);

    const lookup: CompetitorLookup = {
      competitor: match
        ? {
            placeId: String(match.id),
            name: String(match.displayName?.text || 'Unnamed competitor'),
            rating: Number(match.rating) || 0,
            reviewCount: Number(match.userRatingCount) || 0,
            photoCount: Array.isArray(match.photos) ? match.photos.length : 0,
            types: Array.isArray(match.types) ? match.types : [],
          }
        : null,
      rank: selfIndex >= 0 ? selfIndex + 1 : null,
      total: places.length,
    };

    setCached(cacheKey, lookup, SEARCH_CACHE_MS);
    return lookup;
  } catch (error) {
    console.warn('Competitor benchmark skipped:', error);
    return empty;
  }
}

/**
 * Shapes one answer: the full report when the unlock token checks out, the
 * teaser for everyone else.
 *
 * The 10-minute cache always stores the FULL report - teasing happens here, on
 * the way out, so an unlocked reload still costs zero extra Google calls.
 */
function withAccess(
  audit: { photoUrl: string; report: AuditReport },
  placeId: string,
  token: string
) {
  if (verifyUnlockToken(token, placeId)) return { ...audit, locked: false };
  return { photoUrl: audit.photoUrl, report: teaseAuditReport(audit.report), locked: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const placeId = body?.placeId;
    const businessName = body?.businessName;
    // The unlock token travels in the body (the page) or as ?t= (emailed link).
    // A valid one is the ONLY way the fix list leaves this endpoint.
    const unlockToken = String(body?.unlock || new URL(req.url).searchParams.get('t') || '').trim();
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE: Only return mock audit data if no API key OR if placeId is a mock ID.
    // The sample scan runs the REAL engine against a plausible listing, so the demo
    // report can never drift from the live report's shape or scoring.
    if (!apiKey || placeId?.startsWith('mock')) {
      const samplePlace = {
        name: 'Smith Plumbing & Heating',
        formatted_address: '12 High Street, Leeds LS1 4AB',
        formatted_phone_number: '+44 7700 900123',
        website: 'https://example.com',
        opening_hours: { openNow: true },
        reviews: [{ publishTime: new Date().toISOString(), rating: 5 }],
        photos: Array.from({ length: 10 }, (_, i) => ({ name: `mock_photo_${i}` })),
        user_ratings_total: 34,
        rating: 4.6,
        editorial_summary: { text: 'Family-run plumbing and heating specialists.' },
        types: ['plumber', 'point_of_interest', 'establishment'],
      };

      const report = await buildAuditReport({
        placeId: String(placeId || 'mock_sample'),
        businessName: samplePlace.name,
        place: samplePlace,
        scan: null, // sample reports never touch the network
        competitor: null,
      });

      // The sample scan runs on invented data against an invented listing, so it
      // stays ungated on purpose: hiding the demo would only hide the product.
      return NextResponse.json({ photoUrl: '', report, locked: false });
    }

    // Rate limit BEFORE the paid Google call (the mock branch above costs nothing).
    const guard = await guardPublicRequest(req, 'audit:run', DETAIL_LIMIT, TOO_MANY_AUDITS);
    if (!guard.allowed) return guard.response;

    // Memoise the finished audit for 10 minutes — review counts and photos move
    // slowly, and reloading a report used to re-bill Google every time.
    // A cache hit means this exact report was generated minutes ago, so the lead
    // was already captured then - reloading a report must never re-write it.
    const auditKey = detailCacheKey('audit:run', String(placeId));
    const cachedAudit = getCached<any>(auditKey);
    if (cachedAudit) return NextResponse.json(withAccess(cachedAudit, String(placeId), unlockToken));

    // 🌍 REAL GOOGLE PLACES API (v1) CALL
    console.log('🔍 Fetching place details via new Places API (v1) for:', placeId);
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,currentOpeningHours,reviews,photos,userRatingCount,rating,editorialSummary,types,location'
        }
      }
    );
    
    const placeData = await res.json();
    
    if (placeData.error) {
      console.error('Places API v1 error:', placeData.error);
      return NextResponse.json({ error: 'Failed to get details' }, { status: 500 });
    }

    // Normalize new API fields to match the format expected by audit functions
    const place = {
      name: placeData.displayName?.text || '',
      formatted_address: placeData.formattedAddress || '',
      formatted_phone_number: placeData.nationalPhoneNumber || placeData.internationalPhoneNumber || '',
      website: placeData.websiteUri || '',
      opening_hours: placeData.currentOpeningHours || null,
      reviews: placeData.reviews || [],
      photos: placeData.photos || [],
      user_ratings_total: placeData.userRatingCount || 0,
      rating: placeData.rating || 0,
      editorial_summary: placeData.editorialSummary || null,
      types: placeData.types || [],
      // Used only to bias the competitor search to the same area.
      location: placeData.location || null,
    };

    console.log(`✅ Place details loaded: ${place.name}, ${place.user_ratings_total} reviews, ${place.photos.length} photos`);
    
    // Build the profile photo URL from the first photo. 400px is the anonymous
    // ceiling on /api/places/photo (the audit tool is public), and it is already
    // sharper than the 144px slot this renders into.
    let photoUrl = '';
    if (placeData.photos && placeData.photos.length > 0) {
      const photoName = placeData.photos[0].name;
      photoUrl = `/api/places/photo?name=${encodeURIComponent(photoName)}&w=400`;
    }

    // Battle table: kick the competitor search off first so it runs while the
    // website is being scanned (both cap at ~6s, so latency stays flat).
    const trade = tradeProfileFor(place.types);
    const competitorPromise = fetchTopCompetitor(
      apiKey,
      String(placeId),
      `${trade.keywords[0] || 'local service'} ${localityFromAddress(place.formatted_address)}`,
      place.location
    );

    // Run the competitor search and the site scan concurrently: both are
    // network-bound and capped at ~6s, so the report waits once, not twice.
    const [lookup, scan] = await Promise.all([
      competitorPromise,
      scanWebsite(place.website, {
        businessName,
        phone: place.formatted_phone_number,
        types: place.types,
      }),
    ]);

    // ONE engine, one report: the payload is the engine's report and nothing
    // else, so no second score can drift away from it.
    const report = await buildAuditReport({
      placeId: String(placeId),
      businessName,
      place,
      scan,
      competitor: lookup.competitor,
      searchRank: lookup.rank,
      rankedOf: lookup.total,
    });

    const audit = { photoUrl, report };

    // LAYER 1 of the audit funnel: a completed audit IS a lead. The capture is
    // idempotent (unique leads.place_id -> refresh, never duplicate) and
    // captureAuditLead() never throws, so a database problem can neither delay
    // nor break the visitor's report.
    await captureAuditLead({
      placeId: String(placeId),
      businessName: businessName || place.name,
      phone: place.formatted_phone_number || null,
      // Same number in machine form: Google's international form already carries
      // the +country code, so captureAuditLead() can derive phone_e164/country
      // without a Places addressComponents lookup. leads.phone stays the raw
      // national value above.
      internationalPhone: placeData.internationalPhoneNumber || null,
      website: place.website || null,
      address: place.formatted_address || null,
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || null,
      types: place.types || null,
      auditScore: report.scores.overall,
    });

    setCached(auditKey, audit, DETAIL_CACHE_MS);
    return NextResponse.json(withAccess(audit, String(placeId), unlockToken));
  } catch (error) {
    console.error('Audit Run Error:', error);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
