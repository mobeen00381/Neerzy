/**
 * Service-area engine (GEO) — works out "the postal codes we cover" for a
 * trader's website.
 *
 * WHY at build time: the list is baked into `websites.content.serviceAreas`
 * (and into the LocalBusiness schema `areaServed` + the visible chips block), so
 * a visitor — or an AI answer engine reading the page — never triggers a Google
 * API call. Rebuild / cron refresh it.
 *
 * HOW: Google Geocoding reverse-lookup of the trader's exact location plus 8
 * points on a 10 km ring (N, NE, E, SE, S, SW, W, NW). Every postal code that
 * comes back inside the ring is one we can honestly claim to serve.
 *
 * Failure policy: no key / no quota / no results → `null`, and the site simply
 * omits the chips block and the schema areaServed list. Nothing ever breaks.
 */

export const SERVICE_AREA_RADIUS_KM = 10;

export type ServiceAreaData = {
  /** Postal / ZIP codes inside the service radius, most central first. */
  postalCodes: string[];
  /** Towns / suburbs / districts inside the radius. */
  localities: string[];
  /** Radius the postal codes were sampled from. */
  radiusKm: number;
  /** Where the sample was taken from. */
  center: { lat: number; lng: number };
  /** ISO timestamp of the API call (cached with the website content). */
  fetchedAt: string;
  source: "google-geocode" | "google-places" | "google-geocode+places";
};

/** Same server-side key ladder the website builder uses. */
function geoKey(): string {
  return (
    process.env.GOOGLE_PLACES_SERVER_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  );
}

type GeoPoint = { lat: number; lng: number };

/**
 * Point `distanceKm` away from `origin` on the given compass bearing.
 * Plain equirectangular maths — accurate to well under a metre at 10 km.
 */
export function offsetPoint(origin: GeoPoint, bearingDeg: number, distanceKm: number): GeoPoint {
  const R = 6371; // km
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const ang = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(ang) * Math.cos(lat1),
      Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: Number(((lat2 * 180) / Math.PI).toFixed(6)),
    lng: Number(((((lng2 * 180) / Math.PI) + 540) % 360 - 180).toFixed(6)),
  };
}

/** 8 compass points on the radius ring (45° apart). */
export function ringPoints(origin: GeoPoint, radiusKm = SERVICE_AREA_RADIUS_KM): GeoPoint[] {
  return [0, 45, 90, 135, 180, 225, 270, 315].map((b) => offsetPoint(origin, b, radiusKm));
}

export function isServiceAreaData(value: any): value is ServiceAreaData {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray(value.postalCodes) &&
    Array.isArray(value.localities) &&
    typeof value.radiusKm === "number"
  );
}

type ReverseResult = {
  postalCode?: string;
  locality?: string;
  admin?: string;
  country?: string;
  formatted?: string;
};

async function reverseGeocode(point: GeoPoint, key: string): Promise<ReverseResult | null> {
  // NOTE: no `result_type` filter. It accepts only `|`-separated types (a comma
  // makes the API reply 400 Bad Request), and an unfiltered lookup returns the
  // postal code, locality and district for every kind of place we sample —
  // including rural and non-English-speaking service areas.
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}` +
    `&key=${key}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json.status !== "OK" || !Array.isArray(json.results) || !json.results.length) {
      if (json.status && json.status !== "ZERO_RESULTS") {
        console.warn(`⚠️ [Service Areas] Geocoding status: ${json.status}`);
      }
      return null;
    }

    const out: ReverseResult = {};
    for (const r of json.results) {
      for (const comp of r.address_components || []) {
        const types: string[] = comp.types || [];
        if (!out.postalCode && types.includes("postal_code")) out.postalCode = comp.short_name;
        if (!out.locality && (types.includes("locality") || types.includes("postal_town"))) {
          out.locality = comp.long_name;
        }
        if (!out.admin && types.includes("administrative_area_level_2")) {
          out.admin = comp.long_name;
        }
        if (!out.country && types.includes("country")) out.country = comp.short_name;
      }
      if (!out.formatted) out.formatted = r.formatted_address;
    }
    return out;
  } catch (err: any) {
    console.warn("⚠️ [Service Areas] reverse geocode failed:", err?.message || err);
    return null;
  }
}

/**
 * Postal codes + towns straight from the Places API (New) nearby search.
 *
 * Post offices are the densest, most reliable source of postal codes around a
 * point, and Places (New) is the API this project already has enabled. Used to
 * fill the gaps reverse geocoding leaves behind (e.g. areas where Google has no
 * postal-code geometry for the sampled ring points).
 */
async function nearbyPlacesAreas(
  geo: GeoPoint,
  radiusKm: number
): Promise<{ postalCodes: string[]; localities: string[] }> {
  const key = geoKey();
  const empty = { postalCodes: [], localities: [] };
  if (!key) return empty;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.addressComponents",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude: geo.lat, longitude: geo.lng },
            radius: Math.round(radiusKm * 1000),
          },
        },
        maxResultCount: 20,
        includedTypes: ["post_office"],
      }),
    });
    if (!res.ok) {
      console.warn(`⚠️ [Service Areas] Places nearby search ${res.status}`);
      return empty;
    }

    const json: any = await res.json();
    const postalCodes: string[] = [];
    const localities: string[] = [];
    for (const place of json.places || []) {
      for (const comp of place.addressComponents || []) {
        const types: string[] = comp.types || [];
        if (types.includes("postal_code") && comp.shortText && !postalCodes.includes(comp.shortText)) {
          postalCodes.push(comp.shortText);
        }
        const locality = comp.longText || comp.shortText;
        if (
          (types.includes("locality") ||
            types.includes("postal_town") ||
            types.includes("administrative_area_level_2") ||
            types.includes("administrative_area_level_3")) &&
          locality &&
          !localities.includes(locality)
        ) {
          localities.push(locality);
        }
      }
    }
    return { postalCodes, localities };
  } catch (err: any) {
    console.warn("⚠️ [Service Areas] nearby places failed:", err?.message || err);
    return empty;
  }
}

/**
 * Build the trader's service-area list.
 * Returns `null` when we cannot prove anything (no key, no location, no data).
 */
export async function computeServiceAreas(
  geo: GeoPoint | null | undefined,
  radiusKm = SERVICE_AREA_RADIUS_KM
): Promise<ServiceAreaData | null> {
  const key = geoKey();
  if (!key || !geo?.lat || !geo?.lng) return null;

  // 1. Reverse-geocode the trader's own point + 8 points on the radius ring.
  const points = [geo, ...ringPoints(geo, radiusKm)];
  const results = await Promise.all(points.map((p) => reverseGeocode(p, key)));

  const center = results[0];
  const postalCodes: string[] = [];
  const localities: string[] = [];
  const seenPostal = new Set<string>();
  const seenLocal = new Set<string>();
  const add = (list: string[], seen: Set<string>, value: string, cap: number) => {
    const v = (value || "").trim();
    if (v && !seen.has(v.toLowerCase()) && list.length < cap) {
      seen.add(v.toLowerCase());
      list.push(v);
    }
  };

  // Centre first → the trader's own postal code always leads the list.
  for (const r of results) {
    if (!r) continue;
    add(postalCodes, seenPostal, r.postalCode || "", 12);
    add(localities, seenLocal, r.locality || r.admin || "", 10);
  }

  // 2. Fill the gaps with nearby post offices (Places API New) — this is what
  //    gives a usable list in dense non-US areas where reverse geocoding of the
  //    sampled points returns no postal code at all.
  let source: ServiceAreaData["source"] = "google-geocode";
  if (postalCodes.length < 4 || localities.length < 2) {
    const nearby = await nearbyPlacesAreas(geo, radiusKm);
    for (const code of nearby.postalCodes) add(postalCodes, seenPostal, code, 12);
    for (const town of nearby.localities) add(localities, seenLocal, town, 10);
    if (nearby.postalCodes.length || nearby.localities.length) {
      source = "google-geocode+places";
    }
  }

  if (!postalCodes.length && !localities.length) return null;

  console.log(
    `📍 [Service Areas] ${localities[0] || "?"} — ${postalCodes.length} postal codes / ` +
      `${localities.length} localities within ${radiusKm} km${center?.country ? ` (${center.country})` : ""} [${source}]`
  );

  return {
    postalCodes,
    localities,
    radiusKm,
    center: { lat: geo.lat, lng: geo.lng },
    fetchedAt: new Date().toISOString(),
    source,
  };
}
