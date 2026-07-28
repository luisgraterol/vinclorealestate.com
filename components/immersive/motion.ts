'use client';

// Shared motion core for the immersive layer. Every animation in
// components/immersive/ goes through these helpers so the reduced-motion
// contract and easing vocabulary stay consistent (see DESIGN.md · Motion).

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

export function ensureGsap() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

// Single source of truth for whether choreographed motion may run.
// Everything falls back to fully visible, static content when this is false.
export function motionOK(): boolean {
  return (
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const EASE = {
  out: 'power3.out',
  outLong: 'power4.out',
  inOut: 'power2.inOut',
} as const;

export const DUR = {
  reveal: 0.9,
  hero: 1.2,
} as const;

// Fired by the Preloader when its curtain lifts; the hero waits for this
// before playing its entrance so the two never overlap.
export const REVEAL_EVENT = 'vinclo:reveal';

export { ScrollTrigger };
