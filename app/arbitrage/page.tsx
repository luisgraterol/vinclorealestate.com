import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FeatureCards from '@/components/FeatureCards';
import Steps from '@/components/Steps';
import ContactSection from '@/components/ContactSection';
import ScrollReveal from '@/components/ScrollReveal';
import Icon from '@/components/icons';
import { ARBITRAGE_BENEFITS, ARBITRAGE_PROCESS } from '@/lib/content/services';
import styles from './page.module.css';

const TITLE = 'Vinclo Arbitrage — Lease Your Unit to a Professional STR Operator';
const DESCRIPTION =
  'Consistent monthly rent from a professional short-term rental operator. Vinclo leases units directly from landlords and operates them as furnished short-term rentals. Currently active in Abilene, TX.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: 'rental arbitrage, master lease, lease to a company, corporate tenant, short term rental operator, landlord guaranteed rent, Abilene TX',
  alternates: { canonical: 'https://vinclorealestate.com/arbitrage' },
  openGraph: { type: 'website', url: 'https://vinclorealestate.com/arbitrage', title: TITLE, description: DESCRIPTION },
};

export default function ArbitragePage() {
  return (
    <div>
      <Nav />
      <main>
        {/* HERO */}
        <section className="page-hero">
          <div className="page-hero__grid" />
          <div className="page-hero__inner">
            <div className="eyebrow page-hero__eyebrow">Vinclo Arbitrage &middot; For Landlords</div>
            <h1 className="page-hero__title">Consistent rent.<br />A professional <em>operator</em>.</h1>
            <p className="page-hero__sub">
              We lease your unit directly and operate it ourselves as a furnished
              short-term rental. You get reliable rent and a well-maintained property &mdash;
              without managing tenants or turnovers yourself.
            </p>
            <div className="page-hero__btns">
              <Link href="#contact" className="btn-primary">Lease Your Unit to Vinclo <span className="btn-arrow">&#8594;</span></Link>
              <Link href="#how" className="btn-outline-light">How It Works <span className="btn-arrow">&#8594;</span></Link>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="vsection" style={{ background: '#faf8f4' }}>
          <div className={styles.header}>
            <div className="section-label center">Why Lease to Vinclo</div>
            <h2 className="section-title">Reliability, handled <em>professionally</em></h2>
            <p className="section-intro" style={{ margin: '0 auto' }}>
              We carry the leasing and operating risk. You get a dependable, business-grade
              tenant that treats your unit like an asset.
            </p>
          </div>
          <FeatureCards items={ARBITRAGE_BENEFITS} columns={4} />
        </section>

        {/* PROCESS */}
        <section id="how" className="vsection dark-section">
          <div className={styles.header}>
            <div className="section-label center">How It Works</div>
            <h2 className="section-title">From unit review <em>to launch</em></h2>
          </div>
          <Steps steps={ARBITRAGE_PROCESS} />
        </section>

        {/* MARKET / DISCIPLINE */}
        <section className={`vsection ${styles.market}`}>
          <div className={styles.marketLayout}>
            <div className="reveal">
              <div className="section-label">Deal Discipline</div>
              <h2 className="section-title">We only lease <em>units that work</em></h2>
              <p className={styles.marketBody}>
                Every candidate unit runs through our own financial model &mdash; with{' '}
                <strong>conservative and base-case scenarios</strong> &mdash; before we make
                an offer. We confirm subletting is permitted and check local STR regulations
                up front, so the lease we sign is one we can honor.
              </p>
              <ul className={styles.checks}>
                <li><Icon name="check-circle" /> Subletting and STR compliance verified before we offer</li>
                <li><Icon name="check-circle" /> Conservative underwriting on every unit</li>
                <li><Icon name="check-circle" /> Furnishing, listing, and vendors handled by us</li>
              </ul>
            </div>
            <div className="reveal reveal-delay-1">
              <div className={styles.mapCard}>
                <div className={styles.mapLabel}>Current Arbitrage Market</div>
                <div className={styles.mapCity}>Abilene, <em>Texas</em></div>
                <p className={styles.mapDesc}>
                  Steady year-round demand from Dyess Air Force Base, Abilene&apos;s
                  universities, and corporate and healthcare travelers. We expand into new
                  markets only where the demand, regulations, and economics hold up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ContactSection variant="landlord" />
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
