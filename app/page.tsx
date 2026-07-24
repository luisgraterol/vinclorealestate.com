import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import BusinessLines from '@/components/BusinessLines';
import StatsBand from '@/components/StatsBand';
import PropertyGrid from '@/components/PropertyGrid';
import Reviews from '@/components/Reviews';
import FeatureCards from '@/components/FeatureCards';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';
import HashRedirect from '@/components/HashRedirect';
import { TRUST_ITEMS } from '@/lib/content/services';
import styles from './page.module.css';

const TITLE = 'Vinclo Real Estate — Short-Term Rental Management & Operations';
const DESCRIPTION =
  'Vinclo Real Estate is a professional short-term rental company built on two lines: co-hosting and management for property owners, and rental arbitrage for landlords. Miami · Nashville · Abilene, TX.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords:
    'short term rental management, Airbnb co-host, property management, STR arbitrage, vacation rental management, Airbnb management company, Abilene TX, Nashville, Miami',
  alternates: { canonical: 'https://vinclorealestate.com/' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const MARQUEE = [
  'Property Management', 'Co-Hosting', 'STR Arbitrage', 'Revenue Management',
  'Guest Experience', 'Data-Driven Pricing', 'Miami', 'Nashville', 'Abilene, TX',
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HashRedirect />
      <Nav />

      <main>
        {/* HERO */}
        <section id="hero" className={styles.hero}>
          <div className={styles.heroBg}><div className={styles.heroGridLines} /></div>
          <div className={styles.heroGeo} />
          <div className={styles.heroGeo2} />
          <div className={styles.heroContent}>
            <div className="eyebrow" style={{ marginBottom: 28 }}>Management &amp; Arbitrage &middot; Est. 2026</div>
            <h1 className={styles.heroHeadline}>Short-term rentals,<br />run like a <em>business</em></h1>
            <p className={styles.heroSub}>
              Two business lines, one professional operator. We co-host and manage
              properties for owners, and lease and operate units for landlords &mdash;
              backed by real data and hands-on hospitality.
            </p>
            <div className={styles.heroBtns}>
              <Link href="/management" className="btn-primary">For Property Owners <span className="btn-arrow">&#8594;</span></Link>
              <Link href="/arbitrage" className="btn-outline-light">For Landlords <span className="btn-arrow">&#8594;</span></Link>
            </div>
            <div className={styles.heroTertiary}>
              Looking to book a stay? <Link href="/stays">Browse our properties &#8594;</Link>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className={styles.marqueeStrip} aria-hidden="true">
          <div className={styles.marqueeInner}>
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {MARQUEE.map(m => (
                  <span key={m} className={styles.marqueeItem}>{m}<span className={styles.marqueeDot} /></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* BUSINESS LINES */}
        <section id="business-lines" className="vsection" style={{ background: '#f2ede4' }}>
          <div className={`${styles.centerHeader} reveal`}>
            <div className="section-label center">Two Business Lines</div>
            <h2 className="section-title">One operator, <em>two ways to work with us</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              Whether you own a property you&apos;d rather not manage, or a unit you&apos;d
              rather lease to a reliable operator &mdash; we have a line built for you.
            </p>
          </div>
          <BusinessLines />
        </section>

        {/* STATS (renders only when real figures are set) */}
        <StatsBand />

        {/* STAYS TEASER */}
        <section id="stays-teaser" className="vsection" style={{ background: '#faf8f4' }}>
          <div className={`${styles.centerHeader} reveal`}>
            <div className="section-label center">Our Stays</div>
            <h2 className="section-title">The properties <em>we operate</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              Every stay reflects the standard we hold across both lines &mdash; furnished,
              professionally managed, and guest-ready.
            </p>
          </div>
          <PropertyGrid limit={3} />
          <div className={styles.centerCta}>
            <Link href="/stays" className="btn-outline-dark">View All Stays <span className="btn-arrow">&#8594;</span></Link>
          </div>
        </section>

        {/* REVIEWS (renders only when real reviews are set) */}
        <Reviews />

        {/* WHY VINCLO */}
        <section id="why" className="vsection dark-section" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className={styles.whyGrid} />
          <div className={`${styles.centerHeader} reveal`} style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-label center">Why Vinclo</div>
            <h2 className="section-title">Personal attention,<br /><em>backed by professional systems</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              We operate with the discipline of an institutional manager and the
              responsiveness of a dedicated owner &mdash; on both lines.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: 56 }}>
            <FeatureCards items={TRUST_ITEMS} columns={4} dark />
          </div>
        </section>

        <ContactSection variant="general" />
      </main>

      <Footer />
      <ScrollReveal />
    </div>
  );
}
