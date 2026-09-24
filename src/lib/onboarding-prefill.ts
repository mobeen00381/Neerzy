/**
 * Hand-off of the business a visitor picked in the /website-builder preview.
 *
 * WHY sessionStorage: the preview widget already has the full listing (address,
 * category, rating, photo) and onboarding needs all of it to show
 * "✅ Selected: …" without asking the visitor to search a second time. A couple
 * of query params can't carry that, and sessionStorage survives the signup
 * redirect (and the Google OAuth round-trip) in the same tab.
 *
 * Stale entries are ignored after 30 minutes so an abandoned session can't
 * prefill a business the visitor no longer remembers choosing.
 */

export const ONBOARDING_PREFILL_KEY = "neerzy.prefill.business";
export const ONBOARDING_PREFILL_MAX_AGE_MS = 30 * 60 * 1000;

export interface OnboardingPrefill {
  placeId: string;
  name: string;
  address: string;
  primaryType: string;
  rating: number | null;
  photoUrl: string | null;
  savedAt: number;
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    // Private mode / storage disabled — the flow simply loses the shortcut.
    return null;
  }
}

export function saveOnboardingPrefill(
  prefill: Omit<OnboardingPrefill, "savedAt">
): void {
  const store = storage();
  if (!store || !prefill.placeId) return;
  try {
    store.setItem(
      ONBOARDING_PREFILL_KEY,
      JSON.stringify({ ...prefill, savedAt: Date.now() } satisfies OnboardingPrefill)
    );
  } catch {
    // Storage full — the visitor just searches once more.
  }
}

/** The stored business, or null when missing, malformed or older than 30 min. */
export function readOnboardingPrefill(): OnboardingPrefill | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(ONBOARDING_PREFILL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnboardingPrefill;
    if (!parsed?.placeId || !parsed?.name) return null;
    if (Date.now() - (parsed.savedAt || 0) > ONBOARDING_PREFILL_MAX_AGE_MS) {
      store.removeItem(ONBOARDING_PREFILL_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasOnboardingPrefill(): boolean {
  return readOnboardingPrefill() !== null;
}

export function clearOnboardingPrefill(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(ONBOARDING_PREFILL_KEY);
  } catch {
    // nothing to do
  }
}
