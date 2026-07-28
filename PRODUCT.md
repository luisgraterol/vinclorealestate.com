# Vinclo Real Estate — Product Brief

## Register

brand

## What We Do

Vinclo Real Estate is a US-based short-term rental (STR) company built on **two complementary business lines** under one parent brand (full strategy in `cohosting.md`):

- **Vinclo Management (Line A — co-hosting / third-party management).** We manage other owners' properties as short-term rentals. We don't own them; the owner keeps the asset and income, and Vinclo runs the operation for a commission (~20% of booking revenue). Core message: *You own the property. We handle the hosting.* Owner-facing (B2B).
- **Vinclo Arbitrage (Line B — STR rental arbitrage).** We lease units directly from landlords, furnish them, and operate them ourselves as short-term rentals, capturing the spread. Landlord-facing (B2B) plus the guest-facing operation of those units.

The two lines reinforce each other: arbitrage builds operating experience and case studies that make the management pitch credible; landlord and owner relationships cross-feed both lines; both share one operational backbone (guest comms, pricing, cleaning, reporting).

Markets: **Management** experience across Miami & Nashville; **Arbitrage** currently active in **Abilene, TX** (Dyess AFB, Hardin-Simmons/ACU/McMurry, corporate/healthcare demand). Positioned as multi-market / national, not limited to one city.

## Primary Audiences

### 1. Property Owners (Vinclo Management — B2B, primary)
- Owners with an STR (or a property that could be one) who don't want to manage it themselves
- Need: more income, less work, protection of the asset
- Tone: professional, data-driven, "personal attention backed by professional systems"
- CTA: *Find out what your property could earn* / *Free property consultation*

### 2. Landlords (Vinclo Arbitrage — B2B)
- Landlords open to leasing a unit to a company rather than an individual tenant
- Need: consistent rent, reliable professional operator, clean legal framework
- Tone: reliability-first, business-partner framing
- CTA: *Lease your unit to Vinclo*

### 3. Guests (operating side / proof)
- Military & government (TDY, PCS, contractors near Dyess AFB), corporate & healthcare travelers, university visitors
- Need: clean, furnished, flexible-stay housing
- Serves as credibility/proof for both B2B lines
- CTA: *Browse our properties* / *Book on Airbnb*

## Brand Voice

- **Professional and premium** — not budget, not flashy. Think boutique hotel confidence.
- **Trustworthy and local** — deep Abilene market knowledge, not a faceless national operator.
- **Direct and confident** — no fluff. State what we offer, why it matters, how to get it.
- **Military-aware** — understands the cadence of PCS moves, TDY lengths, BAH rates.

## Visual Identity

- **Colors:** Navy (#0f1f2e), Gold (#c9a96e), Cream (#faf8f4)
- **Typography:** Cormorant Garamond (headings — elegant serif), DM Sans (body — clean sans)
- **Feel:** Premium real estate meets boutique hospitality. Think luxury short-let agency, not Airbnb clone.

## Anti-References (What We Are NOT)

- ❌ Vacation rental platforms (Vrbo, Airbnb listing pages) — we're the operator, not the marketplace
- ❌ Budget motels or extended-stay chains (Extended Stay America aesthetic)
- ❌ Generic real estate agency sites with stock photo slideshows
- ❌ Overly corporate / cold / enterprise-looking
- ❌ Gradient-heavy, glassmorphism, trendy "startup" aesthetics

## Product Scope

### Public Site
The public site is **Vinclo Management only** — one business line, one audience (property owners). The arbitrage line stays internal (see `/admin`); no public page references it.
- **`/` (home)** → owner pitch: hero, value props, services, proof/stats, how-it-works, aligned pricing, reviews, owner contact CTA
- **`/portfolio`** → proof of operating standard (Haven at The Gulch, Nashville). Placeholder today; rebuilt as an immersive case study in a later phase.

Retired routes 301-redirect in `next.config.ts`: `/management` → `/`, `/arbitrage` → `/`, `/stays` → `/portfolio`.

Shared UI lives in `components/` (Nav, Footer, ContactSection, StatsBand, Reviews, FeatureCards, ServiceGrid, Steps, icons). Copy/data lives in `lib/content/` (services, stats, properties, reviews, site). Real stats/reviews/listings are user-populated — placeholder entries are hidden from the live site automatically.

### Admin Portal (`/admin`)
Internal tool for Vinclo operators. Password-protected.
- **Property Financial Calculator** — evaluate STR arbitrage opportunities: input property details, revenue assumptions, costs → get P&L, ROI, break-even, risk flags
- **Save & compare analyses** — persist to Supabase, compare multiple properties side-by-side
- **Export to Markdown** — shareable analysis reports

### Auth Flow (`/auth/login`, `/auth/callback`)
Email/password login + forgot-password reset. Supabase Auth. Single-operator use (small team).

## Design Goals for Migration

1. Preserve the existing premium aesthetic — this is a refinement, not a rebrand
2. Fix any visual inconsistencies that crept in from hand-crafted inline CSS
3. Ensure the admin calculator is scannable and data-dense without feeling cluttered
4. Mobile-first — travelers check availability on phones
5. Fast — static site, minimal JS, no layout shift
