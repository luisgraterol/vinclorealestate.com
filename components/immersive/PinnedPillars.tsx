'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ensureGsap, motionOK } from './motion';
import { MANAGEMENT_VALUE_PROPS } from '@/lib/content/services';
import styles from './PinnedPillars.module.css';

const IMAGES = [
  {
    src: '/portfolio/furnished-living-skyline.jpg',
    alt: 'Furnished living area at Haven at The Gulch, sofa and kitchenette against a wall of windows over the Nashville skyline',
  },
  {
    src: '/portfolio/furnished-bedroom-accent.jpg',
    alt: 'Made-up bedroom at Haven at The Gulch with a wood accent wall, brass sconces, and city views',
  },
  {
    src: '/portfolio/furnished-bath-terrazzo.jpg',
    alt: 'Bathroom at Haven at The Gulch with a terrazzo counter, brass fixtures, and a round mirror',
  },
];

// The three pillars as a pinned crossfade scene on desktop. Each panel is a
// complete copy+image unit, so on mobile, reduced motion, or no JS the same
// markup stacks in reading order; the pinning is pure enhancement.
export default function PinnedPillars() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;
    if (!window.matchMedia('(min-width: 960px) and (pointer: fine)').matches) return;

    const gsap = ensureGsap();
    el.classList.add(styles.pinned);

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(`.${styles.panel}`, el);
      const ticks = gsap.utils.toArray<HTMLElement>(`.${styles.tick}`, el);

      gsap.set(panels, { opacity: i => (i === 0 ? 1 : 0), pointerEvents: i => (i === 0 ? 'auto' : 'none') });
      gsap.set(ticks[0], { backgroundColor: '#c9a96e' });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 0.5,
        },
      });

      for (let i = 1; i < panels.length; i++) {
        tl.to({}, { duration: 0.6 }) // hold current panel
          .to(panels[i - 1], { opacity: 0, duration: 0.35 })
          .to(ticks[i - 1], { backgroundColor: 'rgba(201,169,110,.25)', duration: 0.1 }, '<')
          .fromTo(
            panels[i],
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.45 },
            '>-0.05',
          )
          .to(ticks[i], { backgroundColor: '#c9a96e', duration: 0.1 }, '<');
      }
      tl.to({}, { duration: 0.6 }); // hold last panel before unpin
    }, el);

    return () => {
      ctx.revert();
      el.classList.remove(styles.pinned);
    };
  }, []);

  return (
    <section ref={ref} className={styles.section} aria-label="What Vinclo Management delivers">
      <div className={styles.ticks} aria-hidden="true">
        {MANAGEMENT_VALUE_PROPS.map(p => (
          <span key={p.title} className={styles.tick} />
        ))}
      </div>
      {MANAGEMENT_VALUE_PROPS.map((p, i) => (
        <div key={p.title} className={styles.panel}>
          <div className={styles.copy}>
            <div className={styles.index}>{String(i + 1).padStart(2, '0')}</div>
            <h3 className={styles.title}>{p.title}</h3>
            <p className={styles.desc}>{p.desc}</p>
          </div>
          <div className={styles.frame}>
            <Image
              src={IMAGES[i].src}
              alt={IMAGES[i].alt}
              fill
              sizes="(max-width: 960px) 100vw, 44vw"
              quality={80}
            />
            <div className={styles.tint} />
          </div>
        </div>
      ))}
    </section>
  );
}
