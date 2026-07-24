import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FeatureCards from '@/components/FeatureCards';
import ServiceGrid from '@/components/ServiceGrid';
import Steps from '@/components/Steps';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';
import { MANAGEMENT_VALUE_PROPS, MANAGEMENT_SERVICES, MANAGEMENT_PROCESS } from '@/lib/content/services';
import styles from './page.module.css';

const TITLE = 'Vinclo Management — Airbnb Co-Hosting & Property Management';
const DESCRIPTION =
  'You own the property. We handle the hosting. Full-service short-term rental management and co-hosting for property owners — pricing, guests, cleaning, and reporting, all managed.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: 'Airbnb co-host, short term rental management, property management for owners, vacation rental management, STR management company',
  alternates: { canonical: 'https://vinclorealestate.com/management' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/management', title: TITLE, description: DESCRIPTION },
};

export default function ManagementPage() {
  return (
    <div>
      <Nav />
      <main>
        {/* HERO */}
        <section className="page-hero">
          <div className="page-hero__grid" />
          <div className="page-hero__inner">
            <div className="eyebrow page-hero__eyebrow">Vinclo Management &middot; For Owners</div>
            <h1 className="page-hero__title">You own the property.<br />We handle the <em>hosting</em>.</h1>
            <p className="page-hero__sub">
              Full-service co-hosting and management for short-term rentals. You keep the
              asset and the income &mdash; we run the operation, from pricing and guests to
              cleaning and reporting.
            </p>
            <div className="page-hero__btns">
              <Link href="#contact" className="btn-primary">Free Property Consultation <span className="btn-arrow">&#8594;</span></Link>
              <Link href="#services" className="btn-outline-light">See Our Services <span className="btn-arrow">&#8594;</span></Link>
            </div>
          </div>
        </section>

        {/* VALUE PROPS */}
        <section className="vsection" style={{ background: '#faf8f4' }}>
          <div className={styles.header}>
            <div className="section-label center">What We Deliver</div>
            <h2 className="section-title">More income, less work,<br /><em>and your asset protected</em></h2>
          </div>
          <FeatureCards items={MANAGEMENT_VALUE_PROPS} columns={3} />
        </section>

        {/* SERVICES */}
        <section id="services" className="vsection" style={{ background: '#f2ede4' }}>
          <div className={styles.header}>
            <div className="section-label center">Full-Service Management</div>
            <h2 className="section-title">Everything your rental needs, <em>handled</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              A complete operation across six areas &mdash; from launch to day-to-day
              hosting to owner reporting.
            </p>
          </div>
          <ServiceGrid services={MANAGEMENT_SERVICES} />
        </section>

        {/* PROCESS */}
        <section className="vsection dark-section">
          <div className={styles.header}>
            <div className="section-label center">How It Works</div>
            <h2 className="section-title">A clear path from <em>call to launch</em></h2>
          </div>
          <Steps steps={MANAGEMENT_PROCESS} />
        </section>

        {/* PRICING */}
        <section className={`vsection ${styles.pricing}`}>
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

        <ContactSection variant="owner" />
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
