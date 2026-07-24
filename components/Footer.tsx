import Link from 'next/link';
import { SITE } from '@/lib/content/site';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  const socials = [
    { label: 'Instagram', href: SITE.social.instagram as string },
    { label: 'Airbnb', href: SITE.social.airbnb as string },
  ].filter(s => s.href.length > 0);

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div>
          <div className={styles.brand}>
            Vinclo <span>Real Estate</span>
          </div>
          <p className={styles.tagline}>
            Professional short-term rental management and operations. You own the property —
            we handle the hosting.
          </p>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Business Lines</div>
          <ul>
            <li><Link href="/management">Vinclo Management</Link></li>
            <li><Link href="/arbitrage">Vinclo Arbitrage</Link></li>
            <li><Link href="/stays">Our Stays</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Company</div>
          <ul>
            <li><Link href="/#why">Why Vinclo</Link></li>
            <li><Link href="/#contact">Contact</Link></li>
            <li><Link href="/auth/login">Owner Login</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Get in Touch</div>
          <ul>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            {SITE.phones.map(p => (
              <li key={p.href}><a href={p.href}>{p.display}</a></li>
            ))}
            <li><span>{SITE.markets}</span></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.meta}>© {year} {SITE.brand} · All rights reserved</div>
        {socials.length > 0 && (
          <div className={styles.social}>
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
