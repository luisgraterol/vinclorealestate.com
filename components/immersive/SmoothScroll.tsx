'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { ensureGsap, ScrollTrigger, motionOK } from './motion';

// Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger scenes and
// the scroll position never drift apart. Reduced-motion users keep native
// scrolling untouched.
export default function SmoothScroll() {
  useEffect(() => {
    if (!motionOK()) return;

    const gsap = ensureGsap();
    const lenis = new Lenis({
      duration: 1.1,
      // Native inertia on touch devices; smoothing only where it helps.
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
