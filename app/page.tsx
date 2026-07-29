import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import StatsBand from '@/components/StatsBand';
import Reviews from '@/components/Reviews';
import ServiceGrid from '@/components/ServiceGrid';
import Steps from '@/components/Steps';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';
import HashRedirect from '@/components/HashRedirect';
import SmoothScroll from '@/components/immersive/SmoothScroll';
import Preloader from '@/components/immersive/Preloader';
import HeroCinematic from '@/components/immersive/HeroCinematic';
import Manifesto from '@/components/immersive/Manifesto';
import PinnedPillars from '@/components/immersive/PinnedPillars';
import PortfolioTeaser from '@/components/immersive/PortfolioTeaser';
import Reveal from '@/components/immersive/Reveal';
import RevealText from '@/components/immersive/RevealText';
import { MANAGEMENT_SERVICES, MANAGEMENT_PROCESS } from '@/lib/content/services';
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

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HashRedirect />
      <Preloader />
      <SmoothScroll />
      <Nav />

      <main>
        <HeroCinematic />

        <Manifesto />

        {/* PROOF */}
        <StatsBand />

        {/* THE THREE PILLARS */}
        <PinnedPillars />

        {/* SERVICES */}
        <section id="services" className="vsection" style={{ background: '#f2ede4' }}>
          <div className={styles.centerHeader}>
            <RevealText as="h2" className="section-title">
              Everything your rental needs, <em>handled</em>
            </RevealText>
            <Reveal as="p" className="section-intro" variant="fade" delay={0.15}>
              A complete operation across six areas, from launch to day-to-day hosting
              to owner reporting.
            </Reveal>
          </div>
          <ServiceGrid services={MANAGEMENT_SERVICES} />
        </section>

        {/* PORTFOLIO */}
        <PortfolioTeaser />

        {/* PRICING */}
        <section id="pricing" className={`vsection ${styles.pricing}`}>
          <div className={styles.pricingLayout}>
            <Reveal>
              <RevealText as="h2" className="section-title">
                We earn when <em>you earn</em>
              </RevealText>
              <p className={styles.pricingBody}>
                Full-service management runs at approximately{' '}
                <strong>20% of booking revenue</strong> &mdash; our incentives are tied
                directly to your property&apos;s performance. Rates flex by market, volume,
                and scope, and owners with multiple properties can negotiate. A-la-carte
                services and setup fees are available where they fit better.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
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
            </Reveal>
          </div>
        </section>

        {/* PROCESS */}
        <section id="how-it-works" className="vsection" style={{ background: '#faf8f4' }}>
          <div className={styles.centerHeader}>
            <RevealText as="h2" className="section-title">
              A clear path from <em>call to launch</em>
            </RevealText>
          </div>
          <Steps steps={MANAGEMENT_PROCESS} light />
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
