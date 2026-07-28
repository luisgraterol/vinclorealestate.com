import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';

const TITLE = 'Portfolio — Short-Term Rentals We Operate | Vinclo Management';
const DESCRIPTION =
  'A look at the properties Vinclo Management operates, starting with Haven at The Gulch in Nashville — the standard we hold on every property we run.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords:
    'short term rental portfolio, Airbnb management Nashville, The Gulch Nashville short term rental, professionally managed vacation rental, STR operator portfolio',
  alternates: { canonical: 'https://vinclorealestate.com/portfolio' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/portfolio', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const headerStyle = { textAlign: 'center', maxWidth: 720, margin: '0 auto' } as const;

export default function PortfolioPage() {
  return (
    <div>
      <Nav />
      <main>
        {/* HERO */}
        <section className="page-hero">
          <div className="page-hero__grid" />
          <div className="page-hero__inner">
            <div className="eyebrow page-hero__eyebrow">Portfolio &middot; Nashville</div>
            <h1 className="page-hero__title">The properties <em>we operate</em></h1>
            <p className="page-hero__sub">
              Proof of the operating standard we hold for every owner we work with.
            </p>
          </div>
        </section>

        {/* PLACEHOLDER */}
        <section className="vsection" style={{ background: '#faf8f4' }}>
          <div style={headerStyle} className="reveal">
            <div className="section-label center">Featured Property</div>
            <h2 className="section-title">Haven at The Gulch, <em>Nashville</em></h2>
            <p className="section-intro" style={{ margin: '0 auto 40px' }}>
              Full experience coming soon. In the meantime, tell us about your property
              and we&apos;ll show you what professional management changes.
            </p>
            <Link href="/#contact" className="btn-outline-dark">
              Talk to Us <span className="btn-arrow">&#8594;</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
