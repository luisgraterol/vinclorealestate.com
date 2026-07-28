// Shared site-wide contact + brand constants, reused by the nav, footer,
// and contact section so there is a single source of truth.

export const SITE = {
  brand: 'Vinclo Real Estate',
  email: 'rgraterol@vinclorealestate.com',
  phones: [
    { display: '+1 (786) 531-4280', href: 'tel:+17865314280' },
    { display: '+1 (346) 448-8034', href: 'tel:+13464488034' },
  ],
  whatsapp: 'https://wa.me/17865314280',
  markets: 'Miami · Nashville',
  platforms: 'Airbnb · VRBO · Furnished Finder',
  // Optional social handles — leave empty to hide the link.
  social: {
    instagram: '', // e.g. 'https://instagram.com/...'
    airbnb: '', // e.g. 'https://airbnb.com/users/show/...'
  },
} as const;
