import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import AudienceTabs from '@/components/AudienceTabs';
import ScrollReveal from '@/components/ScrollReveal';
import HashRedirect from '@/components/HashRedirect';
import styles from './page.module.css';

const TITLE = 'Vinclo Real Estate — Premium Short-Term Housing · Abilene, TX';
const DESCRIPTION =
  'Fully furnished, professionally managed short-term housing near Dyess Air Force Base. Built for military TDY personnel, government contractors, and university visitors.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    'short term rental Abilene TX, military housing Abilene, TDY housing Dyess Air Force Base, furnished housing Abilene Texas, corporate housing Abilene',
  alternates: {
    canonical: 'https://vinclorealestate.com/',
  },
  openGraph: {
    type: 'website',
    url: 'https://vinclorealestate.com/',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HashRedirect />
      <Nav />

      <main>
        {/* HERO */}
        <section id="hero" className={styles.hero}>
          <div className={styles.heroBg}><div className={styles.heroGridLines}></div></div>
          <div className={styles.heroGeo}></div>
          <div className={styles.heroGeo2}></div>
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>Abilene, Texas &middot; Est. 2026</div>
            <h1 className={styles.heroHeadline}>Premium furnished housing<br />for those who <em>serve &amp; build</em></h1>
            <p className={styles.heroSub}>Professional short-term accommodations for military personnel, government contractors, and university visitors &mdash; managed with precision.</p>
            <div className={styles.heroBtns}>
              <a href="#audience" className={styles.btnPrimary}>Find Your Stay <span className={styles.btnArrow}>&#8594;</span></a>
              <a href="#landlords" className={styles.btnSecondaryHero}>For Landlords <span className={styles.btnArrow}>&#8594;</span></a>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className={styles.marqueeStrip} aria-hidden="true">
          <div className={styles.marqueeInner}>
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} style={{ display: 'contents' }}>
                <span className={styles.marqueeItem}>Military TDY Housing<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>Government Contractors<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>University Visitors<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>Dyess Air Force Base<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>Professionally Managed<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>Fully Furnished<span className={styles.marqueeDot}></span></span>
                <span className={styles.marqueeItem}>Abilene, Texas<span className={styles.marqueeDot}></span></span>
              </span>
            ))}
          </div>
        </div>

        {/* AUDIENCE / GUESTS */}
        <section id="audience" className={styles.audience}>
          <div className={`${styles.audienceHeader} reveal`}>
            <h2 className={styles.sectionTitle}>The right home for <em>every kind of stay</em></h2>
          </div>
          <AudienceTabs />
          <div className={`${styles.audienceCta} reveal`}>
            <a href="#contact" className={styles.btnPrimary} style={{ opacity: 1, animation: 'none' }}>Inquire About Availability <span className={styles.btnArrow}>&#8594;</span></a>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className={styles.services}>
          <div className={styles.servicesLayout}>
            <div className={`${styles.servicesIntro} reveal`}>
              <h2 className={styles.sectionTitle}>Residential properties,<br /><em>elevated</em> for short stays</h2>
              <p className={styles.sectionIntro}>We lease, furnish, and manage residential properties in Abilene, TX &mdash; delivering hotel-quality comfort in a home setting for guests who demand reliability.</p>
            </div>
            <div className={styles.servicesCards}>
              <div className={`${styles.serviceCard} reveal reveal-delay-1`}>
                <div className={styles.serviceNumber}>01</div>
                <div className={styles.serviceName}>Furnished Properties</div>
                <p className={styles.serviceDesc}>Every property is curated and fully furnished to a consistent standard &mdash; premium linens, smart home access, high-speed WiFi, and everything guests need from day one.</p>
              </div>
              <div className={`${styles.serviceCard} reveal reveal-delay-2`}>
                <div className={styles.serviceNumber}>02</div>
                <div className={styles.serviceName}>Military &amp; Corporate Housing</div>
                <p className={styles.serviceDesc}>Optimized for TDY personnel, per diem travelers, and government contractors. Flexible stays from one night to 29 days, with seamless booking and zero-friction check-in.</p>
              </div>
              <div className={`${styles.serviceCard} reveal reveal-delay-3`}>
                <div className={styles.serviceNumber}>03</div>
                <div className={styles.serviceName}>Abilene, TX Market</div>
                <p className={styles.serviceDesc}>Strategically located near Dyess Air Force Base and Abilene&apos;s universities. Year-round demand means consistent availability and competitive rates for guests who plan ahead.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className={styles.trust}>
          <div className={styles.trustLayout}>
            <div className={`${styles.trustHeader} reveal`}>
              <div className={styles.sectionLabel} style={{ color: 'rgba(201,169,110,.6)' }}>Why Us</div>
              <h2 className={styles.sectionTitle}>Built on trust,<br /><em>backed by credentials</em></h2>
              <p className={styles.sectionIntro}>We operate with the transparency and professionalism of an institutional property manager &mdash; at the responsiveness of a dedicated owner.</p>
            </div>
            <div className={styles.trustGrid}>
              <div className={`${styles.trustCard} reveal reveal-delay-1`}>
                <div className={styles.trustIcon}><svg viewBox="0 0 44 44"><rect x="8" y="10" width="28" height="24" rx="2"/><path d="M15 10V7a7 7 0 0 1 14 0v3"/><circle cx="22" cy="22" r="3"/></svg></div>
                <div className={styles.trustTitle}>Licensed Texas LLC</div>
                <p className={styles.trustDesc}>Registered with the Texas Secretary of State. We operate as a formal business entity with full legal standing.</p>
              </div>
              <div className={`${styles.trustCard} reveal reveal-delay-2`}>
                <div className={styles.trustIcon}><svg viewBox="0 0 44 44"><path d="M22 8l11 4v10c0 7-5 12-11 14C11 34 6 29 6 22V12z"/><path d="M16 22l4 4 8-8"/></svg></div>
                <div className={styles.trustTitle}>STR Insurance</div>
                <p className={styles.trustDesc}>Fully insured through a specialized short-term rental carrier with $1M+ per-occurrence coverage. Landlords are named as additional insured.</p>
              </div>
              <div className={`${styles.trustCard} reveal reveal-delay-3`}>
                <div className={styles.trustIcon}><svg viewBox="0 0 44 44"><circle cx="22" cy="16" r="6"/><path d="M10 36c0-6.627 5.373-12 12-12s12 5.373 12 12"/></svg></div>
                <div className={styles.trustTitle}>Professional Management</div>
                <p className={styles.trustDesc}>Local cleaning, maintenance, and operations partners ensure properties are always guest-ready. Issues resolved within 24 hours.</p>
              </div>
              <div className={`${styles.trustCard} reveal reveal-delay-4`}>
                <div className={styles.trustIcon}><svg viewBox="0 0 44 44"><path d="M22 6c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16S30.837 6 22 6z"/><path d="M14 22l5 5 11-11"/></svg></div>
                <div className={styles.trustTitle}>Verified Airbnb Host</div>
                <p className={styles.trustDesc}>Listed on Airbnb with identity verification, guest screening, and the backing of Airbnb&apos;s AirCover host protection program.</p>
              </div>
            </div>
          </div>
        </section>

        {/* LANDLORDS */}
        <section id="landlords" className={styles.landlords}>
          <div className={styles.landlordGeo}></div>
          <div className={styles.landlordLayout}>
            <div className="reveal" style={{ position: 'relative', zIndex: 1 }}>
              <div className={styles.sectionLabel}>For Landlords</div>
              <h2 className={styles.sectionTitle}>Your property,<br /><em>managed right</em></h2>
              <p className={styles.sectionIntro} style={{ marginBottom: 36 }}>We partner with Abilene landlords who want reliable, professional tenants &mdash; without the headaches of managing short-term guests themselves.</p>
              <a href="#contact" className={styles.btnPrimary} style={{ opacity: 1, animation: 'none' }}>Talk to Us <span className={styles.btnArrow}>&#8594;</span></a>
            </div>
            <div className={`${styles.landlordBenefits} reveal reveal-delay-1`}>
              <div className={styles.landlordBenefit}>
                <div className={styles.lbIcon}><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                <div>
                  <div className={styles.lbTitle}>Guaranteed Monthly Rent</div>
                  <p className={styles.lbDesc}>We pay on a fixed schedule via ACH, every month, whether the property is occupied or not. No vacancy risk, no late payments.</p>
                </div>
              </div>
              <div className={styles.landlordBenefit}>
                <div className={styles.lbIcon}><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <div>
                  <div className={styles.lbTitle}>Professional Operations</div>
                  <p className={styles.lbDesc}>We handle cleaning, maintenance coordination, guest screening, and 24-hour issue response. Your property is treated like a business asset.</p>
                </div>
              </div>
              <div className={styles.landlordBenefit}>
                <div className={styles.lbIcon}><svg viewBox="0 0 24 24"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg></div>
                <div>
                  <div className={styles.lbTitle}>$1M Insurance Coverage</div>
                  <p className={styles.lbDesc}>You are named as additional insured on our STR-specific policy. Guest damage is covered via Airbnb AirCover. Your asset is protected at every layer.</p>
                </div>
              </div>
              <div className={styles.landlordBenefit}>
                <div className={styles.lbIcon}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                <div>
                  <div className={styles.lbTitle}>Clean Legal Framework</div>
                  <p className={styles.lbDesc}>We operate with a formal sublease addendum &mdash; Texas-law compliant, attorney-reviewed &mdash; that protects your rights and clearly defines responsibilities.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className={styles.contact}>
          <div className={styles.contactGeo}></div>
          <div className={styles.contactInner}>
            <div className="reveal">
              <div className={styles.sectionLabel}>Contact</div>
              <h2 className={styles.sectionTitle}>Let&apos;s start a<br /><em>conversation</em></h2>
              <p className={styles.sectionIntro} style={{ marginBottom: 40 }}>Whether you&apos;re a prospective guest, a landlord looking to partner, or a corporate travel coordinator &mdash; we respond within one business day.</p>
              <div className={styles.contactDetail}>
                <div className={styles.contactLine}>
                  <div className={styles.contactIcon}><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                  <div>
                    <div className={styles.contactLineLabel}>Email</div>
                    <div className={styles.contactLineValue}><a href="mailto:lgraterol@vinclorealestate.com">lgraterol@vinclorealestate.com</a></div>
                  </div>
                </div>
                <div className={styles.contactLine}>
                  <div className={styles.contactIcon}><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg></div>
                  <div>
                    <div className={styles.contactLineLabel}>Phone / WhatsApp</div>
                    <div className={styles.contactLineValue}><a href="tel:+17865314280">+1 (786) 531-4280</a> &middot; <a href="tel:+13464488034">+1 (346) 448-8034</a></div>
                  </div>
                </div>
                <div className={styles.contactLine}>
                  <div className={styles.contactIcon}><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                  <div>
                    <div className={styles.contactLineLabel}>Market</div>
                    <div className={styles.contactLineValue}>Abilene, Texas &mdash; 79605 &amp; 79606</div>
                  </div>
                </div>
                <div className={styles.contactLine}>
                  <div className={styles.contactIcon}><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
                  <div>
                    <div className={styles.contactLineLabel}>Platform</div>
                    <div className={styles.contactLineValue}>Airbnb &middot; VRBO &middot; Furnished Finder</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.contactCtaBox} reveal reveal-delay-2`}>
              <h3>Ready to book or<br /><em>partner with us?</em></h3>
              <p>Reach out by email, call us directly, or message on WhatsApp. We welcome guests, landlords, and corporate accounts.</p>
              <div className={styles.contactActions}>
                <a href="mailto:lgraterol@vinclorealestate.com" className={styles.btnGoldOutline}>Send an Email <span>&#8594;</span></a>
                <a href="https://wa.me/17865314280" target="_blank" rel="noopener" className={styles.btnWhatsapp}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Vinclo Real Estate</div>
        <div className={styles.footerMeta}>&copy; 2026 Vinclo Real Estate &middot; Abilene, TX &middot; All rights reserved</div>
      </footer>

      <ScrollReveal />
    </div>
  );
}
