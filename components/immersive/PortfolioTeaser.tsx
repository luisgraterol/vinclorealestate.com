'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motionOK } from './motion';
import styles from './PortfolioTeaser.module.css';

// Full-bleed drone-loop backdrop for the portfolio invitation. The video only
// mounts when motion is allowed, only plays while on screen, and always sits
// behind a poster so nothing depends on it loading.
export default function PortfolioTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [withVideo, setWithVideo] = useState(false);

  useEffect(() => {
    if (motionOK()) setWithVideo(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [withVideo]);

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Portfolio: Haven at The Gulch">
      <div className={styles.media} aria-hidden="true">
        {withVideo ? (
          <video
            ref={videoRef}
            className={styles.video}
            src="/portfolio/video/loop-pool.mp4"
            poster="/portfolio/video/poster-pool.jpg"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.video} src="/portfolio/video/poster-pool.jpg" alt="" />
        )}
        <div className={styles.scrim} />
      </div>
      <div className={styles.content}>
        <p className={styles.kicker}>Where we operate</p>
        <h2 className={styles.headline}>
          Haven at <em>The Gulch</em>
        </h2>
        <p className={styles.sub}>Nashville, Tennessee. Two units, one standard.</p>
        <Link href="/portfolio" className="btn-primary">
          View the property <span className="btn-arrow">&#8594;</span>
        </Link>
      </div>
    </section>
  );
}
