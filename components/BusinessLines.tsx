import Link from 'next/link';
import Icon, { type IconName } from './icons';
import styles from './BusinessLines.module.css';

interface Line {
  tag: string;
  icon: IconName;
  name: string;
  who: string;
  desc: string;
  points: string[];
  href: string;
  cta: string;
}

const LINES: Line[] = [
  {
    tag: 'Line A · Management',
    icon: 'home',
    name: 'Vinclo Management',
    who: 'For property owners',
    desc: 'We co-host and manage your short-term rental as a full-service operation. You keep the asset and the income — we run the hosting.',
    points: [
      'You own the property, we handle the hosting',
      'Pricing, guests, cleaning & reporting — all managed',
      'Commission on booking revenue, no leasing risk to you',
    ],
    href: '/management',
    cta: 'For owners',
  },
  {
    tag: 'Line B · Arbitrage',
    icon: 'key',
    name: 'Vinclo Arbitrage',
    who: 'For landlords',
    desc: 'We lease your unit directly and operate it ourselves as a short-term rental — you get consistent rent from a professional operator.',
    points: [
      'We lease your unit and run it end to end',
      'Consistent monthly rent, professionally maintained',
      'Clear lease with an STR subletting addendum',
    ],
    href: '/arbitrage',
    cta: 'For landlords',
  },
];

export default function BusinessLines() {
  return (
    <div className={styles.grid}>
      {LINES.map((l, i) => (
        <Link key={l.name} href={l.href} className={`${styles.card} reveal reveal-delay-${i + 1}`}>
          <div className={styles.tag}>{l.tag}</div>
          <div className={styles.iconWrap}><Icon name={l.icon} /></div>
          <div className={styles.name}>{l.name}</div>
          <div className={styles.who}>{l.who}</div>
          <p className={styles.desc}>{l.desc}</p>
          <ul className={styles.points}>
            {l.points.map(p => <li key={p}>{p}</li>)}
          </ul>
          <span className={styles.link}>{l.cta} <span>&#8594;</span></span>
        </Link>
      ))}
    </div>
  );
}
