import type { Metadata } from 'next';
import './globals.css';

const faviconSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%23254a34'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia,serif' font-size='26' font-weight='400' fill='%23c9a96e'%3EV%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: {
    default: 'Vinclo Real Estate — Short-Term Rental Management & Operations',
    template: '%s | Vinclo Real Estate',
  },
  description:
    'Professional short-term rental management and operations. Co-hosting and management for property owners, and rental arbitrage for landlords. Miami · Nashville · Abilene, TX.',
  metadataBase: new URL('https://vinclorealestate.com'),
  icons: {
    icon: faviconSvg,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
