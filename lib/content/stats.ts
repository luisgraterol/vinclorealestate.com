// Headline stats shown on the home page.
//
// IMPORTANT: These are placeholders. Do NOT present unverified figures as
// real claims. Replace each `value` with a true, defensible number and set
// `placeholder: false`. Any stat left with `placeholder: true` is hidden
// from the site automatically (see components/StatsBand.tsx).

export interface Stat {
  value: string;
  label: string;
  placeholder: boolean;
}

export const STATS: Stat[] = [
  { value: '5.0', label: 'Average guest rating', placeholder: true }, // TODO: real figure
  { value: '3', label: 'Markets operated', placeholder: true }, // TODO: real figure (Miami, Nashville, Abilene)
  { value: '100%', label: 'Guest issues handled in 24h', placeholder: true }, // TODO: real figure
  { value: '2', label: 'Business lines, one operator', placeholder: false },
];
