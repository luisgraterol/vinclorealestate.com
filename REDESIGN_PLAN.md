# Vinclo Management — Immersive Site Redesign Plan

**Scope:** Public-facing site only. `/admin`, `/auth`, Supabase, middleware, and all
login-protected code stay untouched. The public site narrows to **one business line:
short-term rental property management** ("Vinclo Management"). All arbitrage content is
removed.

**References:** [era.estate](https://era.estate) (dark navy, Art Deco, WebGL, page
transitions) and [111w57.com](https://111w57.com) (photography-led quiet luxury, layered
scroll reveal).

**Decisions already made (with Luis):**
- Evolve the existing navy/gold "Garrison Estate" identity — don't replace it.
- `/stays` becomes an owner-facing **Portfolio** (proof of operating standard), not a
  booking marketplace.
- Featured property: **Haven at The Gulch (Nashville)** only.
- Tech path: hybrid cinematic-scroll + targeted WebGL (analysis below).

---

## 1. Asset & tech analysis → why hybrid WebGL

What we actually have (Google Drive):
- ~98 professional photos of Haven at The Gulch: two units (426 & 1017, several shot
  **unfurnished**), building amenities (pool courtyard, gym, lounges), neighborhood, and
  2 virtual-tour stills. All 2048px, bright daylight, MLS-style color grading.
- One 352 MB drone video (Division St) — the single strongest cinematic asset.
- 15 iPhone apartment photos (usable as small supporting shots at most).
- Luis starred the best images in Drive (the API connector can't query stars — see §8).

**The problem:** 111w57-style immersion is carried by moody, styled, editorial
photography. Ours is bright leasing photography of one property. A photo-led site would
look like a nicer Airbnb listing, not a luxury operator.

**The answer (agreeing with Luis's instinct):** let **code carry the atmosphere** and
use photos selectively, treated to fit the brand:

1. **Cinematic scroll foundation** — Lenis smooth scroll, GSAP ScrollTrigger scenes,
   masked/parallax image reveals, character-level headline animation, route transitions,
   a branded preloader. This is the skeleton of both reference sites.
2. **Targeted WebGL layer (Three.js)** — *generative, brand-native visuals that need no
   photo assets*:
   - Hero: full-viewport navy scene — slow-moving gold particle field / line-drawn
     topography or an abstract Art-Deco-inspired geometry, reacting subtly to cursor
     and scroll. This is the "wow" moment and it's 100% code.
   - All photographs rendered through a shader pipeline: displacement/ripple hover
     effects, RGB-shift page transitions, film grain, and a **navy/gold duotone or
     graded treatment** so the bright MLS photos sit inside the brand world instead of
     fighting it.
   - NOT a 3D building model (era.estate's centerpiece) — we have no 3D assets, and a
     fake model would undercut credibility. Skip it; don't imitate, translate.
3. **Drone video** — transcode to ~10–15 s loops (1080p, muted, ≤6 MB webm/mp4) and use
   as the Portfolio-section backdrop and/or interleaved hero moment, behind a navy
   gradient scrim so text stays readable.

Graceful degradation: every WebGL element has a static/CSS fallback (no-JS, low-power
devices, `prefers-reduced-motion`).

---

## 2. Site architecture

| Route | Action |
|---|---|
| `/` | Rebuild as the immersive Vinclo Management story (single narrative page) |
| `/portfolio` | New — immersive Haven at The Gulch case study (replaces `/stays`) |
| `/management` | Remove; content merges into `/` (301 → `/`) |
| `/arbitrage` | **Delete** (301 → `/`) |
| `/stays` | Delete (301 → `/portfolio`) |
| `/admin`, `/auth` | **Untouched** |

Content purge: remove arbitrage/landlord-leasing references from `Nav`, `Footer`,
`BusinessLines` (component retired), marquee items, metadata/keywords, `HashRedirect`
targets, and `lib/content/*`. The word "arbitrage" should not appear anywhere public.

Redirects live in `next.config.ts` so old links and indexed URLs keep working.

---

## 3. Narrative structure — homepage (`/`)

A single scroll story, alternating navy/cream per the existing Section Alternation Rule.
Copy source of truth: the one-pager (`Vinclo_Management_OnePager_v10.pdf`).

1. **Preloader** (~1.5 s max, once per session): wordmark stroke-draw on navy, counter,
   curtain lift into hero.
2. **Hero** — WebGL navy scene. Display serif headline ("You own it. *We host it.*"),
   one gold italic word. Scroll cue. Nav is transparent → solid navy on scroll.
3. **Manifesto strip** — full-width statement, 111w57-style: large serif line revealed
   word-by-word on scroll ("Professional management with *personal attention*").
4. **Proof band** — 4.85★ guest rating · 149+ reviews · 4+ yrs experience, animated
   count-up, footnote disclaimer from the one-pager. (Wire real figures into the
   existing `StatsBand` gating.)
5. **The three pillars** — More Income / Less Work / Property Protection. Sticky-pinned
   scroll scene: each pillar takes over the viewport with a treated photo and one
   sentence, era.estate-style.
6. **What's included** — the six services as a slow horizontal scroll-jacked row or an
   elegant list with line-reveals (no icon-grid-with-checkmarks; keep DESIGN.md's bans).
7. **Portfolio teaser** — drone-video backdrop, "Haven at The Gulch — Nashville" →
   `/portfolio` with a shared-element/shader page transition.
8. **Alignment section** — "We only win when you win": the ~20% revenue-share model with
   the illustrative $5,000/$1,000/$4,000 example (reuse existing pricing content).
9. **Process** — Discovery → Proposal → Setup → Launch. Vertical timeline with a gold
   progress line drawn by scroll. (This is a genuinely ordered sequence, so numbered
   markers are allowed per DESIGN.md.)
10. **Contact / CTA** — "Find out how much your property could earn." Navy CTA box,
    email + WhatsApp + phones. Keep `variant="owner"` only.

## 4. Portfolio page (`/portfolio`)

An immersive single-property case study (expandable later):
- Full-bleed treated hero image or drone loop; property name in display serif.
- Editorial photo sequences: alternating large/small parallax layouts, shader hover.
  Curate **15–25 of the starred images max** — restraint reads as luxury; 98 images
  reads as MLS.
- Interstitial stats/copy: market, unit mix, what Vinclo operates there.
- Amenity moments (pool courtyard, gym) as full-width breaks.
- Closing CTA: "Your property could run like this." → contact.
- No beds/baths cards, no booking links, no "Sample listing" placeholder system —
  `lib/content/properties.ts` is rewritten around a case-study shape.

---

## 5. Technical plan

**Stack additions** (all client-side, no backend changes):
- `lenis` — smooth scroll.
- `gsap` + ScrollTrigger (free tier is enough: pinning, scrubbing, SplitText can be
  replaced by a tiny custom splitter).
- `three` (vanilla, in a dedicated canvas manager — lighter than react-three-fiber for
  a mostly-static site; r3f acceptable if implementation prefers it).
- No barba.js — Next App Router + View Transitions / a custom transition layer handles
  route changes.

**Architecture:**
- `components/immersive/` — `Preloader`, `SmoothScroll` (Lenis provider), `WebGLCanvas`
  (single shared canvas, scene registry), `ShaderImage` (DOM-synced textured planes),
  `PinnedPillars`, `RevealText`, `PageTransition`.
- One shared WebGL canvas fixed behind/above the DOM, tracking DOM rects for images
  (standard single-canvas technique) — avoids N canvases and context limits.
- Capability gate: WebGL only on desktop-class GPUs + `prefers-reduced-motion: no-preference`;
  otherwise static images with CSS-only reveals. Server components stay server;
  immersion mounts client-side.

**Asset pipeline:** *(images DONE 2026-07-28)*
1. ✅ Raw assets live in `Haven at The Gulch Photos/` (repo root, git-ignored).
   23 curated high-res masters renamed semantically in `assets-src/curated/`
   (git-ignored): 2 twilight heroes (`hero-*`), 4 aerials, 3 exteriors, 3 courtyard/
   pool, 7 interiors (units 426 & 1017), 4 Gulch neighborhood shots.
2. ✅ Optimized 2560px q85 JPEGs generated in `public/portfolio/` (23 files, ~17 MB);
   `next/image` handles responsive sizes + AVIF/WebP at runtime. The navy/gold grade
   is applied live in the WebGL shader (keeps sources clean).
3. TODO (needs ffmpeg, not installed): drone video → trim highlight loops, transcode
   1080p H.264 + VP9, target ≤6 MB per loop, `preload="metadata"`, poster frames.
   Source: `Haven at The Gulch Photos/Photos/videos/1-video-drone-video-division-stmp4.mp4`.

**Performance & accessibility budget:**
- LCP ≤ 2.5 s (hero is code-drawn, so LCP is text — good), CLS ≈ 0, JS bundle for
  immersive layer lazy-loaded after first paint.
- Full keyboard/screen-reader parity: all content is real DOM text; WebGL is decorative
  (`aria-hidden`). Reduced-motion path required for every animation.
- Mobile gets the full design language but simplified physics (no scroll-jacking,
  lighter particle counts or static hero art).

**SEO:** metadata/keywords rewritten for STR property management (drop arbitrage
terms), OG images regenerated from the new hero art, JSON-LD `ProfessionalService`
schema, redirects as in §2.

---

## 6. Design-system evolution (DESIGN.md update)

Keep: navy/gold/cream triad, Cormorant Garamond + DM Sans, square corners, One Voice
Rule, Section Alternation Rule, italic-emphasis rule.

Evolve:
- **Type scale up:** display clamp raised (~`clamp(3.2rem, 8vw, 7rem)`) for hero and
  manifesto moments — the current 5 rem cap reads "brochure," references read "monument."
  Cap stays for inner sections.
- **Motion vocabulary extended:** from "entrance-only" to choreographed scroll scenes —
  documented as a new Motion section (durations, easings — e.g. `power3.out`, 0.8–1.2 s
  reveals, 60–120 ms stagger — pin rules, reduced-motion contract).
- **New primitive:** "treated photography" (navy-graded imagery + grain) added to the
  system; untreated bright MLS photos never appear on navy sections.
- Marquee strip: retire or rebuild as a slow serif ticker — current gold strip reads
  budget against the new bar.

---

## 7. Execution phases

Each phase lands as its own PR, reviewable in isolation. Simple, well-scoped subtasks
(asset processing scripts, content purge, redirects) can go to **Opus/Sonnet subagents**;
design-critical work (WebGL scenes, scroll choreography, art direction) stays in the
main lane, using the `impeccable` skill for the design passes.

1. **Phase 0 — Content & routing surgery** *(small, mechanical — subagent-friendly)*
   Remove arbitrage everywhere, retire `/management` + `/stays`, add redirects, rewrite
   metadata + `lib/content/*` from the one-pager, fix contact email (§8). Site remains
   the current visual design but management-only. Ship first — instant correctness win.
2. **Phase 1 — Asset pipeline** *(subagent-friendly)*
   Curate starred images, processing scripts, image tiers, video loops, poster frames.
3. **Phase 2 — Immersive foundation**
   Lenis + GSAP + canvas manager + preloader + nav behavior + reveal primitives +
   reduced-motion/capability gating. Homepage rebuilt section-by-section on the new
   skeleton (CSS-level motion first — site is already better at this checkpoint).
4. **Phase 3 — WebGL layer**
   Hero scene, ShaderImage pipeline, page transitions. Feature-flagged until stable.
5. **Phase 4 — Portfolio page**
   Case-study build on the now-existing primitives.
6. **Phase 5 — Polish & hardening**
   Cross-device QA, Lighthouse/Core Web Vitals, `impeccable` design audit, copy pass,
   OG/SEO verification, Playwright smoke tests for redirects + reduced-motion rendering,
   DESIGN.md updated to match reality.

---

## 8. Open items — RESOLVED (Luis, 2026-07-28)

1. **Images:** full set downloaded to `Haven at The Gulch Photos/` (repo root,
   git-ignored). Claude curates; Luis vetoes. → 23 picks staged (see §5).
2. **Contact email:** `rgraterol@vinclorealestate.com` is canonical for the public site.
3. **Markets line:** the site claims **Miami and Nashville**.
4. **Stats claims:** 4.85★ / 149+ / 4+ yrs approved with the founder-profile disclaimer.
5. **Drone footage:** confirmed owned/licensed to publish.

Remaining: install `ffmpeg` (e.g. `brew install ffmpeg`) for the video loops (§5.3).
