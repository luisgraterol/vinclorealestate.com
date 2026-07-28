'use client';

import { useEffect, useRef } from 'react';
import { ensureGsap, motionOK, REVEAL_EVENT } from './motion';
import styles from './Preloader.module.css';

const SESSION_KEY = 'vinclo-preloaded';

// Decides BEFORE first paint whether the shroud shows, by stamping an
// attribute on <html>. Runs inline so there is no flash of page content
// underneath. Reduced motion and return visits skip the preloader entirely.
const BOOT_SCRIPT = `(function () {
  try {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && !sessionStorage.getItem('${SESSION_KEY}')) {
      document.documentElement.setAttribute('data-preloading', '');
    }
  } catch (e) {}
})();`;

export default function Preloader() {
  const shroudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const shroud = shroudRef.current;

    const finish = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* private mode: preloader will simply replay */
      }
      html.removeAttribute('data-preloading');
      window.dispatchEvent(new CustomEvent(REVEAL_EVENT));
    };

    if (!html.hasAttribute('data-preloading') || !shroud || !motionOK()) {
      // Nothing to play: let the hero start immediately.
      window.dispatchEvent(new CustomEvent(REVEAL_EVENT));
      return;
    }

    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: finish,
      });
      tl.fromTo(`.${styles.mark}`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 })
        .fromTo(`.${styles.rule}`, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.2')
        .to(shroud, {
          yPercent: -100,
          duration: 0.85,
          ease: 'power4.inOut',
          delay: 0.15,
        });
    }, shroud);

    // Belt and braces: if the timeline is interrupted (tab hidden, etc.),
    // never leave the shroud covering the page.
    const failsafe = window.setTimeout(finish, 3200);

    return () => {
      window.clearTimeout(failsafe);
      ctx.revert();
    };
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      <div ref={shroudRef} className={styles.shroud} aria-hidden="true">
        <div className={styles.mark}>
          Vinclo <em>Management</em>
        </div>
        <div className={styles.rule} />
      </div>
    </>
  );
}
