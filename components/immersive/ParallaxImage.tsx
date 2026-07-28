'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ensureGsap, motionOK } from './motion';
import styles from './ParallaxImage.module.css';

interface ParallaxImageProps {
  src: string;
  alt: string;
  /** wide: 21/9 editorial band. standard: 3/2. tall: 4/5. */
  aspect?: 'wide' | 'standard' | 'tall';
  sizes?: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

// Editorial image with a slow internal parallax drift and the brand's cypress
// tint. Static (no drift) without JS or with reduced motion.
export default function ParallaxImage({
  src,
  alt,
  aspect = 'standard',
  sizes = '100vw',
  caption,
  className,
  priority,
}: ParallaxImageProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      const inner = el.querySelector(`.${styles.inner}`);
      gsap.fromTo(
        inner,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <figure ref={ref} className={`${styles.figure} ${styles[aspect]} ${className ?? ''}`}>
      <div className={styles.inner}>
        <Image src={src} alt={alt} fill sizes={sizes} quality={82} priority={priority} />
      </div>
      <div className={styles.tint} aria-hidden="true" />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
