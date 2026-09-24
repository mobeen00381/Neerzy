"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TEMPLATE_LOOKS, type TemplateId } from "@/lib/template-looks";
import { saveOnboardingPrefill } from "@/lib/onboarding-prefill";

/**
 * Live Google Business Profile preview — the hero interaction on
 * /website-builder.
 *
 * Flow: type a business name → POST /api/audit/search (the SAME protected
 * endpoint the audit tool uses: rate limited to 30/min per IP with a 1-hour
 * block, and memoised for 24h per identical query, so a repeat search costs
 * nothing) → pick your listing → see a mock of the site Neerzy would build,
 * with your real name, photo, rating and trade palette.
 *
 * Scope is deliberately small: this is a HERO-ONLY mock, not the real build.
 * No page generation, no database writes, one template (the one matched to the
 * detected category).
 *
 * Note on the trade match below: the REAL builder lets the AI choose the
 * template (pickTemplate in src/lib/website-builder.ts). This preview uses a
 * dumb keyword heuristic so it can run client-side without a model call.
 */

interface PlaceResult {
  placeId: string;
  name: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photoUrl?: string;
}

const TRADE_KEYWORDS: { id: TemplateId; keys: string[] }[] = [
  { id: "plumber", keys: ["plumber", "plumbing"] },
  { id: "electrician", keys: ["electrician", "electrical"] },
  { id: "hvac", keys: ["hvac", "heating", "air_conditioning", "furnace"] },
  { id: "roofing", keys: ["roofing", "roofer"] },
  { id: "dentist", keys: ["dentist", "dental"] },
  { id: "mechanic", keys: ["car_repair", "mechanic", "auto_"] },
  { id: "grocery", keys: ["grocery", "supermarket"] },
  { id: "hardware", keys: ["hardware"] },
  { id: "handyman", keys: ["handyman", "carpenter", "contractor", "painter", "cleaning", "locksmith"] },
];

/** Category → template, best-effort (preview only). */
function matchTrade(place: PlaceResult): TemplateId {
  const haystack = [...(place.types || []), (place.name || "").toLowerCase()]
    .join(" ")
    .toLowerCase();

  for (const trade of TRADE_KEYWORDS) {
    if (trade.keys.some((key) => haystack.includes(key))) return trade.id;
  }
  return "generic";
}

/** `Smith Plumbing & Heating Ltd` → `smithplumbingheating.com` */
function suggestDomain(name: string): string {
  const slug = (name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(ltd|llc|inc|co|company|limited)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28);
  return `${slug || "yourbusiness"}.com`;
}

export default function PreviewWidget() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [emptyResult, setEmptyResult] = useState(false);
  const [error, setError] = useState("");
  // The photo comes through /api/places/photo, which rate limits anonymous
  // callers — so a broken/blocked image must fall back to the palette block
  // instead of showing a broken-image icon in the hero.
  const [photoBroken, setPhotoBroken] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time search with debounce (same 300ms pattern as the audit tool).
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      setEmptyResult(false);
      return;
    }
    const timer = setTimeout(() => {
      void performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audit/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 6 }),
      });

      if (res.status === 429) {
        setResults([]);
        setShowDropdown(false);
        setEmptyResult(false);
        setError("Too many searches just now — please try again in a few minutes.");
        return;
      }

      const data = await res.json();
      const places: PlaceResult[] = data.places || [];
      setResults(places);
      setShowDropdown(places.length > 0);
      setEmptyResult(places.length === 0);
    } catch (err) {
      console.error("Preview search failed:", err);
      setResults([]);
      setShowDropdown(false);
      setError("We couldn't reach Google just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setEmptyResult(false);
    setError("");
    setPhotoBroken(false);
  };

  const handleSelect = (place: PlaceResult) => {
    setSelected(place);
    setShowDropdown(false);
    setQuery(place.displayName?.text || place.name);
    setPhotoBroken(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trade = selected ? matchTrade(selected) : "generic";
  const look = TEMPLATE_LOOKS[trade];

  return (
    <div style={{ maxWidth: "820px", marginTop: "var(--space-5)" }}>
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
          }}
        >
          <Search size={18} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) setSelected(null);
            }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Type your business name — see the website Neerzy would build"
            aria-label="Search your business on Google"
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "var(--text-body-size)",
              fontFamily: "var(--font-family)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          />
          {loading && (
            <span style={{ fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              Searching…
            </span>
          )}
        </div>

        {showDropdown && (
          <div
            className="card"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              zIndex: 20,
              padding: 0,
              overflow: "hidden",
            }}
          >
            {results.map((place) => (
              <button
                key={place.placeId}
                type="button"
                onClick={() => handleSelect(place)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "var(--space-3) var(--space-4)",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--color-divider)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family)",
                }}
              >
                <span style={{ display: "block", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {place.displayName?.text || place.name}
                </span>
                <span style={{ display: "block", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
                  {place.formattedAddress}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="status" style={{ marginTop: "var(--space-3)", color: "var(--color-text-secondary)" }}>
          {error}
        </p>
      )}

      {emptyResult && !loading && !error && (
        <p role="status" style={{ marginTop: "var(--space-3)", color: "var(--color-text-secondary)" }}>
          No match on that name. Try adding your town or city, or check the spelling.
        </p>
      )}

      {selected && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <p
            style={{
              fontSize: "var(--text-small-size)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-2)",
            }}
          >
            Your future website — built from this profile
          </p>

          {/* Browser-chrome frame. This mocks the visitor's OWN site, so it
              wears the trade palette (product content), not Neerzy chrome. */}
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#FFFFFF",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#F1F5F9",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F87171" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FBBF24" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399" }} />
              <span
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginLeft: "6px",
                  padding: "6px 14px",
                  background: "#FFFFFF",
                  border: "1px solid var(--color-border)",
                  borderRadius: "999px",
                  fontSize: "var(--text-small-size)",
                  color: "var(--color-text-secondary)",
                  overflow: "hidden",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  https://{suggestDomain(selected.displayName?.text || selected.name)}
                </span>
                <span style={{ color: "var(--color-accent-hover)", fontWeight: 700, flexShrink: 0 }}>
                  Available
                </span>
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "var(--space-4)",
                padding: "var(--space-5)",
                background: `linear-gradient(135deg, ${look.colorPalette.primary}14, transparent)`,
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: look.colorPalette.primary,
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {look.name}
                </span>
                <h3
                  style={{
                    fontSize: "var(--text-h2-size)",
                    lineHeight: 1.15,
                    fontWeight: 800,
                    color: look.colorPalette.secondary,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {selected.displayName?.text || selected.name}
                </h3>
                <p style={{ color: "#475569", marginBottom: "var(--space-3)" }}>{selected.formattedAddress}</p>
                {typeof selected.rating === "number" && selected.rating > 0 && (
                  <p style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                    <span style={{ color: "#F59E0B", fontWeight: 700 }}>★ {selected.rating.toFixed(1)}</span>
                    <span style={{ fontSize: "var(--text-small-size)" }}>
                      {selected.user_ratings_total || 0} Google reviews
                    </span>
                  </p>
                )}
                <p
                  style={{
                    marginTop: "var(--space-4)",
                    display: "inline-block",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    background: look.colorPalette.primary,
                    color: "#FFFFFF",
                    fontWeight: 700,
                  }}
                >
                  Get a free quote
                </p>
              </div>

              <div style={{ minHeight: "180px" }}>
                {selected.photoUrl && !photoBroken ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.photoUrl}
                    alt={`Photo of ${selected.displayName?.text || selected.name} from Google`}
                    onError={() => setPhotoBroken(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "180px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "180px",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${look.colorPalette.primary}, ${look.colorPalette.secondary})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      padding: "var(--space-4)",
                      textAlign: "center",
                    }}
                  >
                    Your Google photos go here
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              marginTop: "var(--space-4)",
            }}
          >
            <a
              href={`/signup?placeId=${encodeURIComponent(selected.placeId)}&name=${encodeURIComponent(
                selected.displayName?.text || selected.name
              )}`}
              onClick={() =>
                saveOnboardingPrefill({
                  placeId: selected.placeId,
                  name: selected.displayName?.text || selected.name,
                  address: selected.formattedAddress || "",
                  primaryType:
                    (selected.types || []).find((t) => !t.includes("point_of_interest")) || "",
                  rating: typeof selected.rating === "number" ? selected.rating : null,
                  photoUrl: selected.photoUrl || null,
                })
              }
              className="btn btn-primary"
            >
              Build This Website →
            </a>
            <button type="button" onClick={clearSelection} className="btn btn-secondary">
              Try another business
            </button>
          </div>

          <p
            style={{
              marginTop: "var(--space-3)",
              fontSize: "var(--text-small-size)",
              color: "var(--color-text-secondary)",
            }}
          >
            Preview only — the real build fills in your services, hours, reviews and the rest, then keeps
            them synced with your Google Business Profile.
          </p>
        </div>
      )}
    </div>
  );
}

