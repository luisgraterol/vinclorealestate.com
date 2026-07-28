import type { IconName } from '@/components/icons';

// Content for Vinclo Management — the single public business line
// (short-term rental management / co-hosting for property owners). Copy is
// derived from the Vinclo strategy brief (cohosting.md). Text-only here;
// icons are referenced by key and rendered via components/icons.tsx.

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
