'use client';

import { useEffect, useRef } from 'react';
import { ensureGsap, motionOK } from './motion';
import styles from './Manifesto.module.css';

// Full-width statement whose words brighten as the reader scrolls through it.
// Static (fully readable) without JS or with reduced motion.
export default function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll(`.${styles.w}`);
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 72%',
            end: 'bottom 55%',
            scrub: 0.4,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const line1 = 'Every night priced against live market data. Every turnover inspected. Every guest answered, at any hour.'.split(' ');
  const line2 = 'Personal attention, run like an operation.'.split(' ');

  return (
    <section ref={ref} className={styles.section} aria-label="How Vinclo operates">
      <p className={styles.statement}>
        {line1.map((w, i) => (
          <span key={`a${i}`} className={styles.w}>
            {w}{' '}
          </span>
        ))}
        <em>
          {line2.map((w, i) => (
            <span key={`b${i}`} className={styles.w}>
              {w}{' '}
            </span>
          ))}
        </em>
      </p>
    </section>
  );
}
