// Headline stats shown on the home page.
//
// IMPORTANT: Only true, defensible figures ship. Any stat left with
// `placeholder: true` is hidden from the site automatically (see
// components/StatsBand.tsx). Figures below come from the Vinclo Management
// one-pager and are qualified by STATS_NOTE, which renders with the band.

export interface Stat {
  value: string;
  label: string;
  placeholder: boolean;
}

export const STATS: Stat[] = [
  { value: '4.85', label: 'Guest rating', placeholder: false },
  { value: '149+', label: 'Guest reviews', placeholder: false },
  { value: '4+', label: 'Years industry experience', placeholder: false },
];

// Disclaimer rendered under the stats band whenever any stat is shown.
// Required so the figures are never read as company-wide claims.
export const STATS_NOTE =
  'Guest rating and review count are from our founder’s personal Airbnb hosting profile. ' +
  'Includes 2 years personally hosting as an Airbnb Superhost.';
