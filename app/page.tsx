import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import StatsBand from '@/components/StatsBand';
import Reviews from '@/components/Reviews';
import FeatureCards from '@/components/FeatureCards';
import ServiceGrid from '@/components/ServiceGrid';
import Steps from '@/components/Steps';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';
import HashRedirect from '@/components/HashRedirect';
import { MANAGEMENT_VALUE_PROPS, MANAGEMENT_SERVICES, MANAGEMENT_PROCESS } from '@/lib/content/services';
import styles from './page.module.css';

const TITLE = 'Vinclo Management — Short-Term Rental Property Management';
const DESCRIPTION =
  'You own the property. We handle the hosting. Full-service short-term rental management and co-hosting for property owners — pricing, guests, cleaning, maintenance, and owner reporting. Miami · Nashville.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords:
    'short term rental management, Airbnb management company, Airbnb co-host, property management for owners, vacation rental management, STR management, Nashville, Miami',
  alternates: { canonical: 'https://vinclorealestate.com/' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const MARQUEE = [
  'Property Management', 'Co-Hosting', 'Revenue Management', 'Guest Experience',
  'Data-Driven Pricing', 'Owner Reporting', 'Miami', 'Nashville',
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
            <div className="eyebrow" style={{ marginBottom: 28 }}>Vinclo Management &middot; For Property Owners</div>
            <h1 className={styles.heroHeadline}>You own the property.<br />We handle the <em>hosting</em>.</h1>
            <p className={styles.heroSub}>
              Full-service short-term rental management and co-hosting. You keep the
              asset and the income &mdash; we run the operation, from pricing and guests
              to cleaning and reporting.
            </p>
            <div className={styles.heroBtns}>
              <Link href="#contact" className="btn-primary">Free Property Consultation <span className="btn-arrow">&#8594;</span></Link>
              <Link href="#services" className="btn-outline-light">See Our Services <span className="btn-arrow">&#8594;</span></Link>
            </div>
            <div className={styles.heroTertiary}>
              See how we operate. <Link href="/portfolio">View the portfolio &#8594;</Link>
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

        {/* VALUE PROPS */}
        <section id="what-we-deliver" className="vsection" style={{ background: '#faf8f4' }}>
          <div className={`${styles.centerHeader} reveal`}>
            <div className="section-label center">What We Deliver</div>
            <h2 className="section-title">More income, less work,<br /><em>and your asset protected</em></h2>
          </div>
          <FeatureCards items={MANAGEMENT_VALUE_PROPS} columns={3} />
        </section>

        {/* SERVICES */}
        <section id="services" className="vsection" style={{ background: '#f2ede4' }}>
          <div className={`${styles.centerHeader} reveal`}>
            <div className="section-label center">Full-Service Management</div>
            <h2 className="section-title">Everything your rental needs, <em>handled</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              A complete operation across six areas &mdash; from launch to day-to-day
              hosting to owner reporting.
            </p>
          </div>
          <ServiceGrid services={MANAGEMENT_SERVICES} />
        </section>

        {/* STATS (renders only when real figures are set) */}
        <StatsBand />

        {/* PROCESS */}
        <section id="how-it-works" className="vsection" style={{ background: '#faf8f4' }}>
          <div className={`${styles.centerHeader} reveal`}>
            <div className="section-label center">How It Works</div>
            <h2 className="section-title">A clear path from <em>call to launch</em></h2>
          </div>
          <Steps steps={MANAGEMENT_PROCESS} light />
        </section>

        {/* PRICING */}
        <section id="pricing" className={`vsection ${styles.pricing}`}>
          <div className={styles.pricingLayout}>
            <div className="reveal">
              <div className="section-label">Aligned Pricing</div>
              <h2 className="section-title">We earn when <em>you earn</em></h2>
              <p className={styles.pricingBody}>
                Full-service management runs at approximately{' '}
                <strong>20% of booking revenue</strong> &mdash; our incentives are tied
                directly to your property&apos;s performance. Rates flex by market, volume,
                and scope, and owners with multiple properties can negotiate. A-la-carte
                services and setup fees are available where they fit better.
              </p>
            </div>
            <div className="reveal reveal-delay-1">
              <div className={styles.exampleCard}>
                <div className={styles.exampleLabel}>Illustrative Example</div>
                <div className={styles.exampleRow}>
                  <span className={styles.exampleKey}>Monthly bookings</span>
                  <span className={styles.exampleVal}>$5,000</span>
                </div>
                <div className={styles.exampleRow}>
                  <span className={styles.exampleKey}>Management fee (~20%)</span>
                  <span className={`${styles.exampleVal} ${styles.gold}`}>$1,000</span>
                </div>
                <div className={styles.exampleRow}>
                  <span className={styles.exampleKey}>You keep</span>
                  <span className={styles.exampleVal}>$4,000</span>
                </div>
                <p className={styles.exampleNote}>
                  Illustrative only &mdash; actual figures depend on your property and market.
                  We never promise guaranteed income.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS (renders only when real reviews are set) */}
        <Reviews />

        <ContactSection variant="owner" />
      </main>

      <Footer />
      <ScrollReveal />
    </div>
  );
}
