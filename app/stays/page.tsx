import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import PropertyGrid from '@/components/PropertyGrid';
import AudienceTabs from '@/components/AudienceTabs';
import Reviews from '@/components/Reviews';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';

const TITLE = 'Our Stays — Furnished Short-Term Rentals in Abilene, TX | Vinclo';
const DESCRIPTION =
  'Fully furnished, professionally managed short-term rentals near Dyess Air Force Base and Abilene’s universities. Built for military, corporate, and university travelers.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: 'furnished rental Abilene TX, short term rental Abilene, military housing Dyess AFB, corporate housing Abilene, university visitor housing Abilene',
  alternates: { canonical: 'https://vinclorealestate.com/stays' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/stays', title: TITLE, description: DESCRIPTION },
};

const headerStyle = { textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' } as const;

export default function StaysPage() {
  return (
    <div>
      <Nav />
      <main>
        {/* HERO */}
        <section className="page-hero">
          <div className="page-hero__grid" />
          <div className="page-hero__inner">
            <div className="eyebrow page-hero__eyebrow">Our Stays &middot; Abilene, TX</div>
            <h1 className="page-hero__title">Furnished homes,<br />ready for <em>your stay</em></h1>
            <p className="page-hero__sub">
              Hotel-quality comfort in a home setting &mdash; fully furnished, professionally
              managed, and guest-ready. Built for military, corporate, and university
              travelers near Dyess Air Force Base and Abilene&apos;s universities.
            </p>
            <div className="page-hero__btns">
              <Link href="#properties" className="btn-primary">Browse Properties <span className="btn-arrow">&#8594;</span></Link>
              <Link href="#contact" className="btn-outline-light">Ask About Availability <span className="btn-arrow">&#8594;</span></Link>
            </div>
          </div>
        </section>

        {/* PROPERTIES */}
        <section id="properties" className="vsection" style={{ background: '#faf8f4' }}>
          <div style={headerStyle}>
            <div className="section-label center">The Properties</div>
            <h2 className="section-title">Our Abilene <em>stays</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              Browse our furnished homes below. Every property is held to the same
              professional standard we run across our portfolio.
            </p>
          </div>
          <PropertyGrid />
        </section>

        {/* WHO STAYS */}
        <section className="vsection" style={{ background: '#f2ede4' }}>
          <div style={headerStyle}>
            <div className="section-label center">Who Stays With Us</div>
            <h2 className="section-title">The right home for <em>every kind of stay</em></h2>
          </div>
          <AudienceTabs />
        </section>

        {/* REVIEWS (real only) */}
        <Reviews />

        <ContactSection variant="guest" />
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
