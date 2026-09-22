/**
 * Ownership verification for the Google Business Profile connect flow.
 *
 * WHY THIS EXISTS: the OAuth callback used to take `locations[0]` of
 * `accounts[0]` and save it as the user's business, without ever checking that
 * the connected Google account actually MANAGES the business the user claimed
 * during onboarding. An owner with two listings (or two Google accounts) got
 * the wrong business connected silently, and a mismatch between the claimed
 * listing and the connected one was never noticed.
 *
 * This module is a pure function so every branch can be unit-tested without
 * touching Google or the database.
 */

export interface ManagedLocation {
  /** Google resource name, e.g. `accounts/123/locations/456`. */
  name: string;
  title: string;
  placeId?: string | null;
}

export type GbpVerifyResult =
  /** The claimed listing IS managed by this Google account — safe to connect. */
  | { status: "match"; location: ManagedLocation }
  /** Nothing was claimed and the account manages exactly one listing. */
  | { status: "no_claim_single"; location: ManagedLocation }
  /** Something was claimed, but this account manages none of it. */
  | { status: "mismatch" }
  /** Nothing claimed and several listings exist — needs a chooser (Phase 2). */
  | { status: "no_claim_multiple" }
  /** The connected Google account has no Business Profile listing at all. */
  | { status: "no_locations" }
  /** Same as no_locations, but the user had claimed a business. */
  | { status: "no_locations_claimed" };

/**
 * Decide whether the connected Google account proves ownership of the claimed
 * business. Locations without a `placeId` are ignored: they cannot be verified
 * against what onboarding stored, so connecting one would be guesswork.
 */
export function pickVerifiedLocation(
  managedLocations: ManagedLocation[] | null | undefined,
  claimedPlaceId: string | null | undefined
): GbpVerifyResult {
  const claimed = (claimedPlaceId || "").trim();
  const locations = (managedLocations || []).filter(
    (location) => !!location && typeof location.placeId === "string" && location.placeId.trim() !== ""
  );

  if (locations.length === 0) {
    return claimed ? { status: "no_locations_claimed" } : { status: "no_locations" };
  }

  if (claimed) {
    const claimedMatch = locations.find((location) => location.placeId === claimed);
    // Claimed business is managed by this account -> ownership is proven.
    return claimedMatch ? { status: "match", location: claimedMatch } : { status: "mismatch" };
  }

  // Nothing claimed: only an unambiguous single listing may be connected.
  if (locations.length === 1) return { status: "no_claim_single", location: locations[0] };
  return { status: "no_claim_multiple" };
}

/** True for the two verdicts that are allowed to be persisted. */
export function isConnectableVerdict(
  verdict: GbpVerifyResult
): verdict is Extract<GbpVerifyResult, { status: "match" | "no_claim_single" }> {
  return verdict.status === "match" || verdict.status === "no_claim_single";
}
