'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RevealText from './RevealText';
import Atmosphere from './webgl/Atmosphere';
import { ensureGsap, motionOK, EASE, REVEAL_EVENT } from './motion';
import styles from './HeroCinematic.module.css';

// Full-viewport cinematic hero: a seamless drone-orbit loop of Haven at The
// Gulch over a poster frame, navy scrim, film grain, parallax drift, and an
// entrance that waits for the preloader. Without JS or with reduced motion
// the poster, scrim, and copy are all fully present and nothing plays.
export default function HeroCinematic() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [withVideo, setWithVideo] = useState(false);

  useEffect(() => {
    if (motionOK()) setWithVideo(true);
  }, []);

  // Play only while the hero is on screen.
  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [withVideo]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const gsap = ensureGsap();
    let cleanupEvent: (() => void) | undefined;

    const ctx = gsap.context(() => {
      const media = el.querySelector(`.${styles.media}`);
      const fadeItems = el.querySelectorAll('[data-hero-fade]');

      // Slow parallax drift while the hero scrolls away.
      gsap.fromTo(
        media,
        { yPercent: 0 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        },
      );

      gsap.set(fadeItems, { opacity: 0, y: 18 });
      let played = false;
      const play = () => {
        if (played) return;
        played = true;
        gsap.fromTo(
          media,
          { scale: 1.08 },
          { scale: 1, duration: 2.2, ease: EASE.inOut },
        );
        gsap.to(fadeItems, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: EASE.out,
          stagger: 0.14,
          delay: 0.5,
        });
      };

      if (!document.documentElement.hasAttribute('data-preloading')) {
        play();
      } else {
        window.addEventListener(REVEAL_EVENT, play, { once: true });
        const fallback = window.setTimeout(play, 3500);
        cleanupEvent = () => {
          window.removeEventListener(REVEAL_EVENT, play);
          window.clearTimeout(fallback);
        };
      }
    }, el);

    return () => {
      cleanupEvent?.();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} className={styles.hero} id="hero">
      <div className={styles.media}>
        <Image
          src="/portfolio/video/poster-hero.jpg"
          alt="Drone view of Haven at The Gulch with the Nashville skyline beyond"
          fill
          priority
          quality={85}
          sizes="100vw"
        />
        {withVideo && (
          <video
            ref={videoRef}
            className={styles.video}
            src="/portfolio/video/loop-hero.mp4"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-hidden="true"
          />
        )}
      </div>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <Atmosphere />

      <div className={styles.inner}>
        <p className={styles.kicker} data-hero-fade>
          Vinclo Management &middot; Miami &amp; Nashville
        </p>
        <RevealText as="h1" className={styles.headline} trigger="event" delay={0.2}>
          You own the property. We handle the <em>hosting</em>.
        </RevealText>
        <p className={styles.sub} data-hero-fade>
          Full-service short-term rental management. You keep the asset and the
          income; we run the pricing, the guests, the turnovers, and the reporting.
        </p>
        <div className={styles.btns} data-hero-fade>
          <Link href="#contact" className="btn-primary">
            Request a free consultation <span className="btn-arrow">&#8594;</span>
          </Link>
          <Link href="/portfolio" className="btn-outline-light">
            See how we operate <span className="btn-arrow">&#8594;</span>
          </Link>
        </div>
      </div>

      <div className={styles.cue} aria-hidden="true" data-hero-fade>
        <span className={styles.cueLine} />
      </div>
    </section>
  );
}
