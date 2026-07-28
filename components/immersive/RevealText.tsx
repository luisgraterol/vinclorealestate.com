'use client';

import { useEffect, useRef, type ReactNode, type ElementType } from 'react';
import { ensureGsap, motionOK, EASE, REVEAL_EVENT } from './motion';
import styles from './RevealText.module.css';

interface RevealTextProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /**
   * scroll: plays when the element enters the viewport.
   * event: waits for the preloader's reveal event (hero headline).
   */
  trigger?: 'scroll' | 'event';
  stagger?: number;
  delay?: number;
}

// Masked word-rise for display headlines. Server HTML is the plain heading;
// after mount each word is wrapped in an overflow mask and slid up into view.
// Inline elements (<em>) are preserved, so gold italics survive the split.
export default function RevealText({
  children,
  as: Tag = 'h2',
  className,
  trigger = 'scroll',
  stagger = 0.055,
  delay = 0,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const original = el.innerHTML;

    const splitNode = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = (node.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const w of words) {
          if (w.trim() === '') {
            frag.appendChild(document.createTextNode(w));
            continue;
          }
          const mask = document.createElement('span');
          mask.className = styles.mask;
          const word = document.createElement('span');
          word.className = styles.word;
          word.textContent = w;
          mask.appendChild(word);
          frag.appendChild(mask);
        }
        node.parentNode?.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(splitNode);
      }
    };
    Array.from(el.childNodes).forEach(splitNode);

    const gsap = ensureGsap();
    const words = el.querySelectorAll(`.${styles.word}`);
    gsap.set(words, { yPercent: 115 });

    let cleanupEvent: (() => void) | undefined;
    const ctx = gsap.context(() => {
      let played = false;
      const play = () => {
        if (played) return;
        played = true;
        gsap.to(words, {
          yPercent: 0,
          duration: 1.0,
          ease: EASE.outLong,
          stagger,
          delay,
        });
      };

      if (trigger === 'event') {
        if (!document.documentElement.hasAttribute('data-preloading')) {
          // No preloader this visit: play as soon as we're mounted.
          play();
        } else {
          window.addEventListener(REVEAL_EVENT, play, { once: true });
          // Failsafe mirrors the preloader's own 3.2s ceiling.
          const fallback = window.setTimeout(play, 3500);
          cleanupEvent = () => {
            window.removeEventListener(REVEAL_EVENT, play);
            window.clearTimeout(fallback);
          };
        }
      } else {
        gsap.to(words, {
          yPercent: 0,
          duration: 1.0,
          ease: EASE.outLong,
          stagger,
          delay,
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        });
      }
    }, el);

    return () => {
      cleanupEvent?.();
      ctx.revert();
      el.innerHTML = original;
    };
  }, [trigger, stagger, delay]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
