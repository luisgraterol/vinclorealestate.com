import { SITE } from '@/lib/content/site';
import styles from './ContactSection.module.css';

type Variant = 'general' | 'owner' | 'landlord' | 'guest';

const COPY: Record<Variant, { label: string; title: React.ReactNode; sub: string; box: React.ReactNode; boxSub: string }> = {
  general: {
    label: 'Contact',
    title: <>Let&apos;s start a<br /><em>conversation</em></>,
    sub: 'Whether you own a property, own a unit to lease, or want to book a stay — we respond within one business day.',
    box: <>Own a property, or<br /><em>looking to book?</em></>,
    boxSub: 'Reach out by email, call, or WhatsApp. We welcome property owners, landlords, and guests.',
  },
  owner: {
    label: 'For Property Owners',
    title: <>Find out what your<br /><em>property could earn</em></>,
    sub: 'Tell us about your property and goals. We’ll assess the opportunity and show you how professional management changes the numbers — free, no obligation.',
    box: <>Schedule a free<br /><em>property consultation</em></>,
    boxSub: 'Email or message us about your property. We’ll review it and follow up within one business day.',
  },
  landlord: {
    label: 'For Landlords',
    title: <>Lease your unit<br /><em>to Vinclo</em></>,
    sub: 'If you own a unit and would rather have consistent rent from a professional operator than manage tenants yourself, let’s talk terms.',
    box: <>Talk to us about<br /><em>your unit</em></>,
    boxSub: 'Send us the unit details. If it fits, we move quickly through analysis and lease terms.',
  },
  guest: {
    label: 'Book a Stay',
    title: <>Your next stay<br /><em>starts here</em></>,
    sub: 'Questions about availability, monthly rates, or a specific property? Reach out and we’ll help you find the right home for your stay.',
    box: <>Ready to<br /><em>book your stay?</em></>,
    boxSub: 'Message us directly or book on Airbnb. We respond fast — orders and plans change, and we get that.',
  },
};

export default function ContactSection({ variant = 'general' }: { variant?: Variant }) {
  const c = COPY[variant];
  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.geo} />
      <div className={styles.inner}>
        <div className="reveal">
          <div className="section-label">{c.label}</div>
          <h2 className="section-title">{c.title}</h2>
          <p className="section-intro" style={{ marginBottom: 40 }}>{c.sub}</p>
          <div className={styles.detail}>
            <div className={styles.line}>
              <div className={styles.icon}><svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div>
              <div>
                <div className={styles.lineLabel}>Email</div>
                <div className={styles.lineValue}><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
              </div>
            </div>
            <div className={styles.line}>
              <div className={styles.icon}><svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" /></svg></div>
              <div>
                <div className={styles.lineLabel}>Phone / WhatsApp</div>
                <div className={styles.lineValue}>
                  {SITE.phones.map((p, i) => (
                    <span key={p.href}>{i > 0 && ' · '}<a href={p.href}>{p.display}</a></span>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.line}>
              <div className={styles.icon}><svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
              <div>
                <div className={styles.lineLabel}>Markets</div>
                <div className={styles.lineValue}>{SITE.markets}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.ctaBox} reveal reveal-delay-2`}>
          <h3>{c.box}</h3>
          <p>{c.boxSub}</p>
          <div className={styles.actions}>
            <a href={`mailto:${SITE.email}`} className={styles.btnGold}>Send an Email <span>&#8594;</span></a>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
