// Guest reviews shown on the home + stays pages.
//
// IMPORTANT: Only real, unedited guest reviews should ever appear here.
// Replace the samples below with genuine Airbnb/VRBO reviews (with guest
// first name + month/year) and set `placeholder: false`. Any review left
// with `placeholder: true` is hidden from the site automatically
// (see components/Reviews.tsx). Do NOT fabricate testimonials.

export interface Review {
  quote: string;
  guest: string;
  date: string;
  property?: string;
  placeholder: boolean;
}

export const REVIEWS: Review[] = [
  { quote: 'Add a real guest review here.', guest: 'Guest name', date: 'Month Year', placeholder: true },
  { quote: 'Add a real guest review here.', guest: 'Guest name', date: 'Month Year', placeholder: true },
  { quote: 'Add a real guest review here.', guest: 'Guest name', date: 'Month Year', placeholder: true },
];
