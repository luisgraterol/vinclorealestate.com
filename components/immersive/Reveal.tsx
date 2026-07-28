'use client';

import { useEffect, useRef, type ReactNode, type ElementType } from 'react';
import { ensureGsap, motionOK, EASE, DUR } from './motion';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** rise: fade + translate up. fade: opacity only. */
  variant?: 'rise' | 'fade';
  delay?: number;
  y?: number;
}

// Scroll-entrance wrapper. The element is fully visible in the server HTML;
// GSAP hides it only after mount and only when motion is allowed, so no-JS,
// bots, and reduced-motion all get the complete page.
export default function Reveal({
  children,
  as: Tag = 'div',
  className,
  variant = 'rise',
  delay = 0,
  y = 36,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: variant === 'rise' ? y : 0 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.reveal,
          delay,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: 'top 84%', once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [variant, delay, y]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
