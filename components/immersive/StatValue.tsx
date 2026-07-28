'use client';

import { useEffect, useRef } from 'react';
import { ensureGsap, motionOK } from './motion';

// Count-up for a stat like "4.85", "149+", "4+". The real value is in the
// server HTML; the count-up only replaces it after mount when motion is on.
export default function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;
    const target = parseFloat(match[1]);
    const suffix = match[2] ?? '';
    const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;

    const gsap = ensureGsap();
    const counter = { n: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        n: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = counter.n.toFixed(decimals) + suffix;
        },
        onComplete: () => {
          el.textContent = value;
        },
      });
    }, el);

    return () => {
      ctx.revert();
      el.textContent = value;
    };
  }, [value]);

  return <span ref={ref}>{value}</span>;
}
