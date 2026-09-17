-- ============================================================
-- 20260918_domains_premium_pricing.sql
-- Premium-domain pricing + local-TLD accounting for the $19 offer
-- ============================================================
--
-- WHY: the local-TLDs workflow sells `.com` plus allowlisted ccTLDs at the flat
-- $19, but a specific name can be PREMIUM-priced by the registry (Porkbun
-- charges far above the TLD's base cost). Those names are sold at
-- wholesale + 20% (PREMIUM_MARKUP in src/lib/domain-registry.ts), so the row
-- needs to record what the trader paid AND what Porkbun charged us — otherwise
-- margin per domain is unknowable and premium sales look identical to $19 ones.
--
--   price_paid     → what the CUSTOMER paid (19, or premium + 20%)
--   wholesale_cost → what Porkbun charged Neerzy (null when unknown)
--   is_premium     → true when the price came from the premium quote flow
--
-- Written by:
--   /api/domains/purchase  → inserts provisioning row with all three fields
--                            (falls back to omitting them if this migration has
--                            not been applied, so purchases never break)
--   /api/webhook/paddle    → flips status; price fields are left untouched
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS only. No data is modified.

ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS wholesale_cost NUMERIC(10,2);

-- Accounting view: margin per sold domain (customer price − registrar cost).
CREATE OR REPLACE VIEW public.domain_margins AS
  SELECT
    d.id,
    d.user_id,
    d.domain_name,
    d.status,
    d.is_premium,
    d.price_paid,
    d.wholesale_cost,
    (d.price_paid - COALESCE(d.wholesale_cost, 0)) AS gross_margin,
    d.created_at
  FROM public.domains d;

-- Only the service role reads margins (RLS on the underlying table still
-- applies to owners reading `domains` directly).
REVOKE ALL ON public.domain_margins FROM anon, authenticated;
GRANT SELECT ON public.domain_margins TO service_role;
