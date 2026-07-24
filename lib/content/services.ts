import type { IconName } from '@/components/icons';

// Content for the two business lines. Copy is derived from the Vinclo
// strategy brief (cohosting.md). Text-only here; icons are referenced by
// key and rendered via components/icons.tsx.

export interface ValueProp {
  icon: IconName;
  title: string;
  desc: string;
}

export interface ServiceItem {
  num: string;
  name: string;
  desc: string;
}

export interface Step {
  num: string;
  title: string;
  desc: string;
}

/* ---------------- Vinclo Management (owners / co-hosting) ---------------- */

// cohosting.md §4 — three things Management sells.
export const MANAGEMENT_VALUE_PROPS: ValueProp[] = [
  {
    icon: 'dollar',
    title: 'More income',
    desc: 'Strategic pricing, listing optimization, and availability management to maximize what your property earns — the same data discipline we use on our own units.',
  },
  {
    icon: 'clock',
    title: 'Less work for you',
    desc: 'You never have to answer guest messages, chase cleaners, or handle a 2am maintenance call. We run the operation end to end.',
  },
  {
    icon: 'shield',
    title: 'Protection & care',
    desc: 'We operate with an eye toward protecting your asset and holding a consistent standard — not just filling the calendar at any cost.',
  },
];

// cohosting.md §5 — six service areas.
export const MANAGEMENT_SERVICES: ServiceItem[] = [
  {
    num: '01',
    name: 'Listing Setup & Optimization',
    desc: 'Listing creation, title and description optimization, photo selection, amenities, house rules, policies, and pre-launch improvement recommendations.',
  },
  {
    num: '02',
    name: 'Revenue Management',
    desc: 'Dynamic pricing, seasonal and demand-based adjustments, booking-window analysis, minimum-stay optimization, and strategies to fill empty nights.',
  },
  {
    num: '03',
    name: 'Guest Management',
    desc: 'Inquiry response, pre-arrival communication, check-in instructions, in-stay support, issue resolution, and post-stay follow-up.',
  },
  {
    num: '04',
    name: 'Operations',
    desc: 'Cleaning and turnover coordination, maintenance and repair handling, local vendor management, supply oversight, and clear owner reporting.',
  },
  {
    num: '05',
    name: 'Property Performance',
    desc: 'Occupancy and revenue tracking, recurring-issue identification, improvement recommendations, and periodic owner reports.',
  },
  {
    num: '06',
    name: 'Additional Services',
    desc: 'Professional photography, initial property setup, design and staging recommendations, guest guidebooks, smart-lock coordination, and multi-platform expansion.',
  },
];

// cohosting.md §9 — management sales/onboarding process.
export const MANAGEMENT_PROCESS: Step[] = [
  { num: '01', title: 'Free consultation', desc: 'We learn your property, your goals, and where the current operation is falling short — no obligation.' },
  { num: '02', title: 'Property analysis', desc: 'Market, competition, rates, estimated occupancy, listing quality, and improvement opportunities. We never promise guaranteed income.' },
  { num: '03', title: 'Proposal', desc: 'A clear scope: services included, responsibilities on both sides, commission, and onboarding steps.' },
  { num: '04', title: 'Onboarding', desc: 'Access, property details, vendors, inventory, rules, and emergency info — organized so nothing slips.' },
  { num: '05', title: 'Launch or transition', desc: 'New listing built and launched, or an existing operation taken over without disrupting current bookings.' },
];

/* ---------------- Vinclo Arbitrage (landlords / leasing) ---------------- */

// cohosting.md §4/§7 — what Arbitrage sells to a landlord.
export const ARBITRAGE_BENEFITS: ValueProp[] = [
  {
    icon: 'dollar',
    title: 'Consistent monthly rent',
    desc: 'We lease your unit directly and pay on a fixed schedule — you get reliable rent from a professional operator instead of chasing individual tenants.',
  },
  {
    icon: 'check-circle',
    title: 'Professional operation',
    desc: 'We furnish, clean, maintain, and manage the unit to a hospitality standard. Your property is run like a business asset, not a rental you hope stays tidy.',
  },
  {
    icon: 'shield',
    title: 'Protected & well-kept',
    desc: 'Insured short-term rental operation with guest screening and 24-hour issue response. Your unit is maintained in consistent, guest-ready condition.',
  },
  {
    icon: 'document',
    title: 'Clean legal framework',
    desc: 'A clear lease with a short-term-rental subletting addendum that defines responsibilities and protects your rights — no ambiguity.',
  },
];

// cohosting.md §9 — arbitrage deal process, landlord-appropriate subset.
export const ARBITRAGE_PROCESS: Step[] = [
  { num: '01', title: 'Unit review', desc: 'We confirm subletting is permitted, check local STR regulations, and gather unit and market details.' },
  { num: '02', title: 'Financial analysis', desc: 'Every unit runs through our deal analyzer with conservative and base-case assumptions before we make an offer.' },
  { num: '03', title: 'Lease terms', desc: 'We agree lease length, rent, deposit, and subletting permissions — terms that work for both sides.' },
  { num: '04', title: 'Setup', desc: 'Furnishing, professional listing, smart locks, supplies, and a local vendor lineup.' },
  { num: '05', title: 'Launch', desc: 'Your unit goes live across Airbnb, VRBO, and other platforms — operated entirely by Vinclo.' },
];

// cohosting.md §12 — shared trust signals (used on home + interior pages).
export interface TrustItem {
  icon: IconName;
  title: string;
  desc: string;
}

export const TRUST_ITEMS: TrustItem[] = [
  {
    icon: 'shield',
    title: 'Licensed & insured',
    desc: 'A formal US business entity operating with short-term-rental insurance coverage on the units we run.',
  },
  {
    icon: 'chart',
    title: 'Data-driven decisions',
    desc: 'The same financial modeling that underwrites our own arbitrage deals informs how we price and report on every property.',
  },
  {
    icon: 'users',
    title: 'Real operating track record',
    desc: 'Hands-on hosting experience across Miami and Nashville, and an active arbitrage operation in Abilene, TX.',
  },
  {
    icon: 'check-circle',
    title: 'Professional systems',
    desc: 'Guest communication, pricing, cleaning, and reporting run on a shared operational backbone — personal attention, backed by systems.',
  },
];
