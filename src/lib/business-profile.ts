import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who owns a business profile?
 *
 * Email/Google signup is the primary entry point and a user may connect
 * WhatsApp later — or never — so `business_profiles.user_id` is the
 * first-class owner key. `user_phone` remains for the WhatsApp pipeline
 * (jobs, review requests, posts) and is filled in when a number is linked.
 *
 * Every lookup goes through here so the two keys can never disagree:
 *   user_id  -> preferred, exists before any phone is linked
 *   phone    -> legacy/WhatsApp rows, tried in every stored format
 */

export interface BusinessProfile {
  id?: string;
  user_id?: string | null;
  user_phone?: string | null;
  business_name?: string | null;
  address?: string | null;
  category?: string | null;
  google_place_id?: string | null;
  google_maps_url?: string | null;
  review_link?: string | null;
  [key: string]: unknown;
}

/**
 * All the phone formats a profile/business row might use. The WhatsApp connect
 * flow stores `profiles.phone` without a "+", while the onboarding form stores
 * `business_profiles.user_phone` with one — a mismatch that once silently
 * disabled website enrichment.
 */
export function phoneVariants(phone: string): string[] {
  const digits = (phone || "").replace(/\D/g, "");
  const set = new Set<string>();
  if (phone) set.add(phone);
  if (digits) {
    set.add(digits);
    set.add(`+${digits}`);
  }
  return [...set].filter(Boolean);
}

export async function findBusinessProfileByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<BusinessProfile | null> {
  if (!phone) return null;
  for (const variant of phoneVariants(phone)) {
    const { data } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_phone", variant)
      .maybeSingle();
    if (data) return data as BusinessProfile;
  }
  return null;
}

export async function findBusinessProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<BusinessProfile | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as BusinessProfile) || null;
}

/** The user's business profile, by owner id first and phone second. */
export async function getBusinessProfileForUser(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  phone?: string | null
): Promise<BusinessProfile | null> {
  if (userId) {
    const byUser = await findBusinessProfileByUserId(supabase, userId);
    if (byUser) return byUser;
  }
  if (phone) return findBusinessProfileByPhone(supabase, phone);
  return null;
}

export type SaveResult =
  | { ok: true; keyedBy: "user_id" | "user_phone" }
  | { ok: false; error: string };

/**
 * Create/update the business profile for a signed-in account.
 *
 * Keyed by `user_id` whenever we have one (works with no phone at all — the
 * email/Google path), and by `user_phone` only for legacy phone-first callers.
 */
export async function saveBusinessProfileForUser(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  phone: string | null | undefined,
  fields: Record<string, unknown>
): Promise<SaveResult> {
  if (userId) {
    const payload = phone ? { ...fields, user_id: userId, user_phone: phone } : { ...fields, user_id: userId };
    const { error } = await supabase.from("business_profiles").upsert(payload, { onConflict: "user_id" });
    return error ? { ok: false, error: error.message } : { ok: true, keyedBy: "user_id" };
  }

  if (phone) {
    const { error } = await supabase
      .from("business_profiles")
      .upsert({ ...fields, user_phone: phone }, { onConflict: "user_phone" });
    return error ? { ok: false, error: error.message } : { ok: true, keyedBy: "user_phone" };
  }

  return { ok: false, error: "No owner key: the account has neither a user id nor a phone number." };
}

/**
 * WhatsApp connected LATER: attach the sender's number to the business profile
 * the account already owns (created while it had no phone). From this moment
 * every phone-based flow — jobs, review requests, posts — finds the profile.
 */
export async function linkPhoneToBusinessProfile(
  supabase: SupabaseClient,
  userId: string,
  phone: string
): Promise<SaveResult> {
  if (!userId || !phone) return { ok: false, error: "userId and phone are both required" };

  const { error } = await supabase
    .from("business_profiles")
    .update({ user_phone: phone, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("user_phone", null);

  return error ? { ok: false, error: error.message } : { ok: true, keyedBy: "user_phone" };
}
