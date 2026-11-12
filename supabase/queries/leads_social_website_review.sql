-- ============================================================================
-- leads_social_website_review.sql
--
-- READ-ONLY. Lists public.leads rows whose stored `website` points at a social
-- network, a link-in-bio page or another Google-hosted placeholder instead of
-- a site the owner controls. The host list is the same one used by
-- src/lib/website-signal.ts (isSocialOrPlaceholderUrl).
--
-- Why: those rows were captured before leads.has_website learned to treat
-- social pages as "no website". New captures now store has_website = false for
-- them (lib/audit-lead.ts) and every reader derives the same verdict from
-- `website`, so this query only finds the rows you may want to review / fix by
-- hand.
--
-- DO NOT run this as a migration. It contains no UPDATE - just the SELECT.
-- To correct a row after reviewing it, run a targeted update, e.g.
--   UPDATE public.leads SET has_website = false WHERE id = '<id>';
-- ============================================================================

WITH placeholder_hosts(domain) AS (
  VALUES
    ('instagram.com'),
    ('facebook.com'),
    ('fb.com'),
    ('fb.me'),
    ('linktr.ee'),
    ('linktree.com'),
    ('tiktok.com'),
    ('twitter.com'),
    ('x.com'),
    ('youtube.com'),
    ('youtu.be'),
    ('wa.me'),
    ('whatsapp.com'),
    ('g.page'),
    ('business.site'),
    ('sites.google.com'),
    ('google.com'),
    ('maps.google.com'),
    ('wixsite.com'),
    ('godaddysites.com'),
    ('carrd.co'),
    ('bio.link'),
    ('beacons.ai'),
    ('lnk.bio'),
    ('taplink.cc'),
    ('wa.link')
),
extracted AS (
  SELECT
    l.id,
    l.business_name,
    l.email,
    l.website,
    l.has_website,
    l.audit_score,
    l.source,
    l.created_at,
    -- Host only: drop scheme, userinfo, path/query/fragment and port.
    lower(
      split_part(
        regexp_replace(
          regexp_replace(
            regexp_replace(btrim(l.website), '^[a-z][a-z0-9+.-]*://', '', 'i'),
            '[/?#].*$', ''
          ),
          '^.*@', ''
        ),
        ':', 1
      )
    ) AS host_raw
  FROM public.leads l
  WHERE l.website IS NOT NULL
    AND btrim(l.website) <> ''
),
normalized AS (
  SELECT
    e.*,
    -- www. / m. are front doors, not identities (mirrors the TS helper).
    rtrim(regexp_replace(e.host_raw, '^(www\.|m\.)+', ''), '.') AS host
  FROM extracted e
)
SELECT
  n.id,
  n.business_name,
  n.email,
  n.website,
  n.host,
  d.domain AS matched_domain,
  n.has_website,
  n.audit_score,
  n.source,
  n.created_at
FROM normalized n
JOIN placeholder_hosts d
  ON n.host = d.domain
  OR n.host LIKE '%.' || d.domain
ORDER BY n.created_at DESC;
