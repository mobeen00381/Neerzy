/**
 * Keyless Google Map block.
 *
 * WHY keyless: the classic `maps.google.com/maps?q=…&output=embed` iframe needs
 * no API key, so a trader's map costs nothing and cannot leak a key into public
 * HTML. The embed is centred on the trader's EXACT coordinates (from Google
 * Business Profile) or their postal code.
 *
 * SEO/AEO/GEO: the visible address line next to the map repeats the same NAP
 * (name, address, phone) that the page's LocalBusiness schema declares, and the
 * marker links out to the full Google Maps listing via `content.mapUrl` (which
 * is also emitted as schema.org `hasMap`).
 */

type Props = {
  /** Latitude / longitude from content.geo. */
  lat?: number | string | null;
  lng?: number | string | null;
  /** Fallback location string (address or postal code) when geo is missing. */
  query?: string | null;
  /** Name shown on the map pin and in the address line. */
  businessName?: string;
  /** Full formatted street address for the NAP line. */
  address?: string;
  /** Postal code covered by the pin (used in the caption + schema). */
  postalCode?: string;
  /** Public Google Maps URL for the "open in Maps" link (schema hasMap). */
  mapUrl?: string;
  /** Zoom level (Google embeds default to 14 here — good for a 10 km radius). */
  zoom?: number;
  /** Corner radius in px — matches the trade template. */
  radius?: number;
  /** Accessible title for the iframe. */
  title?: string;
};

/** Build the keyless embed URL for a real location. */
export function mapEmbedSrc({
  lat,
  lng,
  query,
  zoom = 14,
}: Pick<Props, "lat" | "lng" | "query" | "zoom">): string {
  const hasGeo = lat !== null && lat !== undefined && lat !== "" && lng !== null && lng !== undefined && lng !== "";
  const q = hasGeo ? `${lat},${lng}` : (query || "").trim();
  if (!q) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
}

export default function SiteMap({
  lat,
  lng,
  query,
  businessName = "",
  address = "",
  postalCode = "",
  mapUrl = "",
  zoom = 14,
  radius = 20,
  title,
}: Props) {
  const src = mapEmbedSrc({ lat, lng, query, zoom });
  if (!src) return null;

  const ariaTitle = title || `${businessName || "Our location"}${postalCode ? ` — ${postalCode}` : ""} on Google Maps`;

  return (
    <div className="grid gap-5 md:grid-cols-[1.6fr_1fr] items-stretch">
      <div className="overflow-hidden border border-slate-200 bg-slate-100" style={{ borderRadius: radius }}>
        <iframe
          src={src}
          title={ariaTitle}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[320px] md:h-[420px] border-0"
        />
      </div>

      <div className="flex flex-col justify-center p-5 border border-slate-200 bg-white" style={{ borderRadius: radius }}>
        {businessName && <p className="text-lg font-black">{businessName}</p>}
        {address && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{address}</p>}
        {postalCode && (
          <p className="mt-1 text-sm font-bold text-slate-500">
            {postalCode}
          </p>
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-fit items-center gap-2 px-4 py-2.5 text-sm font-black text-white"
            style={{ backgroundColor: "var(--site-primary)", borderRadius: radius / 2 }}
          >
            📍 Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
