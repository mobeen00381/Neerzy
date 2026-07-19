# Neerzy — Design System
*Reference file for Cline / VS Code. Apply these rules across every page (Home, About, GMB Audit Tool, Pricing, Features, and any new pages). Do not introduce colors, spacing values, or component styles outside what is defined here.*

---

## 0. Design Principle

Neerzy's story is: **finish the job → send one WhatsApp message → Neerzy quietly handles visibility → next customer calls.**

Every page should feel calm, simple, and workflow-driven — not like a SaaS analytics dashboard. Apply this filter to every design decision:

> Does this help tell "one message creates everything," or is it decoration?

If a color, shadow, icon, or section doesn't support that story or basic readability, remove it.

---

## 1. Color System (Locked Palette)

Only these colors are allowed anywhere on the site. No exceptions, no one-off hex values in component code.

### Brand
```css
--color-primary-dark:   #0B3D2E;   /* deep forest green — header, footer, dark section backgrounds */
--color-primary:        #0F5132;   /* secondary dark green — headings on light backgrounds, dark card backgrounds */
--color-accent:         #22C55E;   /* bright green — primary CTA buttons, active states, checkmarks */
--color-accent-hover:   #16A34A;   /* button hover/active state */
```

### Neutrals
```css
--color-bg:             #FFFFFF;   /* default page background */
--color-bg-soft:        #E6F2EA;   /* light mint section background (alternating sections) — deepened from #F0F7F2, which was too close to white to read as separation on a long page */
--color-bg-muted:       #F7F9F8;   /* card background on white sections */
--color-text-primary:   #0A2E22;   /* body copy, near-black green */
--color-text-secondary: #5B6B64;   /* subtext, descriptions */
--color-border:         #E1E8E4;   /* card borders, dividers */
--color-divider:        #D3E6DA;   /* hairline between sections — see 5.1 */
```

### Status (GMB Audit Tool ONLY — do not use elsewhere)
```css
--color-status-pass:    #22C55E;   /* reuse accent green — do not introduce a second green */
--color-status-warn:    #F59E0B;   /* score circle, "needs optimization" */
--color-status-fail:    #EF4444;   /* missing/failed checks */
```

**Rule:** Status colors (warn/fail) are reserved exclusively for the GMB Audit Tool's pass/fail results and score indicator. They must never appear on Home, About, Pricing, or Features pages — those pages use brand + neutral colors only.

### Excluded / Forbidden
- No blue, purple, teal, or secondary accent colors anywhere (currently no blue/purple exists in the palette — keep it that way even for links, focus states, or icons).
- No gradients except the single approved dark CTA gradient below.
- No random opacity-based tints (e.g. `rgba(0,0,0,0.05)` shadows are fine; colored tints are not).

```css
--gradient-cta-dark: linear-gradient(135deg, #0B3D2E 0%, #06251B 100%); /* final CTA band only */
```

---

## 2. Typography

```css
--font-family: 'Inter', -apple-system, sans-serif; /* confirm actual font in use, keep consistent site-wide */

--text-hero:      48px / 1.15 / 700;   /* H1, hero headline */
--text-h2:         36px / 1.2  / 700;  /* section headings */
--text-h3:         22px / 1.3  / 600;  /* card titles */
--text-body:        16px / 1.6  / 400;  /* paragraph copy */
--text-small:        14px / 1.5  / 400;  /* labels, meta text */
```

- Headings always use `--color-primary` or `--color-primary-dark` (never accent green for large text blocks — accent green is for CTAs and highlights only).
- Body copy always `--color-text-secondary` on light backgrounds, `#FFFFFF` at 85% opacity on dark backgrounds.
- Never use more than 2 font weights per section (e.g. 700 for heading, 400 for body). Drop any 500/600 mid-weights currently mixed into small labels.

---

## 3. Spacing Scale

Use only these values for padding, margin, and gap. No arbitrary pixel values in code.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--space-6: 48px;
--space-7: 64px;
--space-8: 96px;
```

### Section rhythm (applies to every full-width section on every page)
```css
padding-top: var(--space-8);     /* 96px desktop */
padding-bottom: var(--space-8);
```
Mobile: reduce to `var(--space-6)` (48px) top/bottom.

**Rule:** every `<section>` uses the exact same top/bottom padding. No section should feel "tighter" or "looser" than another — this was a key inconsistency in the current build.

### Card internal padding
```css
padding: var(--space-4); /* 24px all sides, standard card */
gap: var(--space-3);     /* 16px between icon, heading, body inside a card */
```

### Card-to-card gap (grids)
```css
gap: var(--space-4); /* 24px */
```

---

## 4. Components

### Buttons
- Primary: `--color-accent` background, white text, `border-radius: 9999px` (pill), padding `12px 28px`. Hover → `--color-accent-hover`.
- Secondary: transparent background, `--color-primary-dark` border + text, same pill shape and padding.
- Only ever two button styles on the entire site. No third variant.

### Cards
- One card style, used everywhere icon+label or icon+heading+body content repeats (steps, features, trust points, comparisons).
- `background: var(--color-bg-muted)`, `border: 1px solid var(--color-border)`, `border-radius: 16px`, `box-shadow: 0 2px 8px rgba(11,61,46,0.06)`.
- Never mix bordered cards and "bare icon + text with no container" for the same type of content on the same page. Pick one and apply everywhere (currently inconsistent — fix on Home and About).

### Icons
- Single-color line or duotone icons only, using `--color-primary` or `--color-accent`. Remove any emoji-style icons currently used as section markers (🚿⚡🏠) — replace with the same icon system used elsewhere on the site for consistency.

### Floating badges/tooltips (e.g. "Visibility improved," review-sent snippets)
- Must have a minimum `16px` offset from any element they overlap, with `box-shadow` and `z-index` clearly above the base card — never touching or clipping another container's edge.
- Same badge style (white background, `--color-border` outline, small shadow) used for every floating element site-wide.

### Comparison sections (before/after, without/with)
- Both sides must use identical card structure, height, and icon treatment. Never let one side be plain text and the other a styled card.

---

## 5. Section Types (apply consistently across all pages)

| Section type | Background | Text color |
|---|---|---|
| Hero | `--color-bg-soft` | `--color-primary-dark` heading, `--color-text-secondary` body |
| Alternating content section | Alternate `--color-bg` / `--color-bg-soft` — never two of the same in a row |
| Dark feature/CTA band | `--color-primary-dark` solid, or `--gradient-cta-dark` for the final CTA only | White text |
| Footer | `--color-bg` | `--color-text-primary` |

**Rule:** no more than one dark section in a row. Currently some pages stack dark → dark or leave long stretches of light with no visual break — alternate deliberately.

### 5.1 Section Separation (new — required)

Color alternation alone is not visible enough on a long scrolling page. Every section boundary must use **both** of the following, not just background color:

1. **Hairline divider.** Add `border-top: 1px solid var(--color-divider)` to every section, except: the section directly after the Hero, and any section directly after a dark section (the dark background itself provides the break).
2. **No back-to-back sections with the same or visually similar background.** Before shipping, list every section's background top to bottom and confirm no two in a row match. If a page has an odd number of light sections in a row (e.g. three light content sections needed consecutively for content reasons), insert a hairline divider *and* a card-background shift (e.g. `--color-bg-muted` band) to break up the monotony — never let three sections in a row look identical.
3. **Verify at actual scroll speed, not just in a static screenshot.** A contrast difference that reads fine in an isolated screenshot can disappear when scrolling past it in 1–2 seconds. If you can't tell where one section ends and the next begins while scrolling at normal speed, the contrast isn't strong enough — go back to rule 1 and 2, don't just nudge the hex value slightly.

---

## 6. Cleanup Checklist (apply to every page during implementation)

- [ ] Replace every hardcoded hex/rgb color in the codebase with the tokens above.
- [ ] Remove any blue/purple/teal accents found in code (audit `globals.css`, component-level inline styles, and Tailwind config).
- [ ] Normalize all section padding to the section rhythm scale.
- [ ] Normalize all card components to the single card style.
- [ ] Fix floating element overlaps (hero tooltip, About page WhatsApp bubble, review star snippet) using the offset rule above.
- [ ] Remove emoji icons, replace with the site's icon system.
- [ ] Confirm status colors (warn/fail/orange/red) only appear inside the GMB Audit Tool components — nowhere else.
- [ ] Rebuild any plain-text list sections (e.g. About page's numbered 1–5 list) into the standard card/step component.
- [ ] Ensure every comparison layout has equal visual weight on both sides.

---

## 7. Tone of Visual Language

- Simple over decorative. If a section needs an illustration or icon to explain itself, use one icon — not three competing visual elements.
- Every visual should map to a step in the core story: **job finished → message sent → visibility updated → review collected → next customer**. If a graphic doesn't clearly belong to one of those five beats, cut it.
- Whitespace is a feature, not empty space to fill — but every container must have a reason for its size (no oversized empty icon boxes).

---

## 8. Content Integrity Rule (new — required)

Layout, spacing, and color fixes must never remove list items, cards, trust points, or copy. If a change request is about spacing, alignment, grid columns, or visual rhythm, the fix is a **reflow only** — every item that existed before the fix must still exist after it, just laid out differently. If a fix genuinely requires cutting an item for layout reasons, stop and ask before removing it rather than deleting silently. This has already happened twice (Section 9's ownership items, then the Trust section's compliance points) — treat any spacing/layout prompt as content-preserving by default unless content removal is explicitly requested.

---

## 9. Mobile Optimization (new — required across all pages)

The majority of Neerzy's users are on phones. Mobile is the primary target, not a secondary breakpoint checked after desktop looks right. Every page (Home, About, GMB Audit Tool, Pricing, Features) must be verified at a 375–414px viewport before a fix is considered complete — not just visually similar to desktop, actually checked at that width.

- **Touch targets:** every button and tappable link must have a minimum 44x44px tap area, with at least 8px spacing between adjacent tappable elements to prevent mis-taps.
- **Font sizes:** body text minimum 16px on mobile (smaller sizes trigger unwanted zoom-on-focus in iOS Safari for form inputs). Headings scale down proportionally but never below 28px for H1, 22px for H2.
- **Grids collapse to single column** below 640px unless a component is explicitly designed as a 2-up mobile grid (e.g. Section 9's ownership cards may stay 2-column if they still pass the touch-target and readability check at 375px — verify, don't assume).
- **CTA buttons:** primary and secondary CTAs stack vertically (never side-by-side) when they don't comfortably fit the viewport width with padding; each button full-width or near-full-width on mobile.
- **No horizontal scroll:** every section, card grid, and diagram (including the Section 8 flow diagram and Section 7 comparison) must fit within the viewport width on mobile without introducing horizontal scroll. Diagrams with connecting arrows between rows need a mobile-specific layout (e.g. stacked vertically) rather than shrinking a desktop row layout until it's unreadable.
- **Hero mockup placement:** the phone mockup must not push the headline and CTA below the fold on mobile — stack the mockup below the hero copy, not beside it.
- **Section padding on mobile** uses `--space-6` (48px) top/bottom per the spacing scale already defined — confirm this is applied consistently on every page, not just the homepage.

---

## 10. Demo / Illustrative Data Standard (new — required)

Marketing pages (homepage, blog, category guides) frequently need to show what the product looks like — an audit score, a dashboard, a progress chart — without a real customer's data attached. This is standard and honest as long as it's clearly an illustrative example, not presented as a specific real customer's verified result.

- Use **one consistent fictional example business** across every illustrative screenshot sitewide, rather than inventing a new fake business per page. Default: reuse "Smith Plumbing & Heating" (already established on the homepage's Visibility Check preview) wherever a plumbing-specific example is needed; use one comparable fictional business per additional trade vertical if the blog expands (electricians, HVAC, etc.) — never multiple different fake businesses for the same vertical across different pages.
- These are built as real product UI components rendering demo data — not stock images, not illustrations pretending to be screenshots.
- Never caption or present illustrative data as a verified real customer outcome (no "this plumber achieved X," no specific unverified before/after numbers attributed to a named real business). Generic framing ("here's what a low-scoring profile looks like," "an optimized profile scores highly across categories") is fine; a specific real-sounding customer claim is not.
- Genuine product UI with no invented data (an input field, a settings screen, a responsive layout check) should be captured as an actual real screenshot — the demo-data standard applies only where a specific score, result, or data point would otherwise need to be fabricated.
