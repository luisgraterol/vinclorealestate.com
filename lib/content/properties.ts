// Public properties showcase (guest-facing). This is SEPARATE from the
// admin/calculator data in lib/properties.ts (that one is Supabase-backed).
//
// IMPORTANT: These are placeholder listings so the layout is reviewable.
// Replace with real Vinclo listings: add a photo to /public/properties/,
// set a real `airbnbUrl`, correct the counts, and set `placeholder: false`.
// Any listing left with `placeholder: true` renders with a clear
// "Sample listing" badge and no outbound booking link.

export interface Property {
  id: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  sleeps: number;
  image: string | null; // path under /public, e.g. '/properties/oak-street.jpg'
  airbnbUrl: string | null;
  tags: string[];
  placeholder: boolean;
}

export const PROPERTIES: Property[] = [
  {
    id: 'sample-1',
    title: 'Furnished Home near Dyess AFB',
    location: 'Abilene, TX',
    beds: 3,
    baths: 2,
    sleeps: 6,
    image: null,
    airbnbUrl: null,
    tags: ['Military-friendly', 'Full kitchen', 'Fast WiFi'],
    placeholder: true,
  },
  {
    id: 'sample-2',
    title: 'Corporate Stay near ACU',
    location: 'Abilene, TX',
    beds: 2,
    baths: 1,
    sleeps: 4,
    image: null,
    airbnbUrl: null,
    tags: ['Workspace', 'Monthly rates', 'Central'],
    placeholder: true,
  },
  {
    id: 'sample-3',
    title: 'Family-Sized Retreat',
    location: 'Abilene, TX',
    beds: 4,
    baths: 3,
    sleeps: 8,
    image: null,
    airbnbUrl: null,
    tags: ['Sleeps 8', 'Parking', 'In-unit laundry'],
    placeholder: true,
  },
];
