'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motionOK } from './motion';
import styles from './VideoLoop.module.css';

interface VideoLoopProps {
  src: string;
  poster: string;
  children?: ReactNode;
  minHeight?: string;
}

// Full-bleed muted video band. Mounts the video only when motion is allowed,
// plays only while visible, and always has the poster underneath.
export default function VideoLoop({ src, poster, children, minHeight = '72vh' }: VideoLoopProps) {
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
    <section ref={sectionRef} className={styles.section} style={{ minHeight }}>
      <div className={styles.media} aria-hidden="true">
        {withVideo ? (
          <video
            ref={videoRef}
            className={styles.fill}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.fill} src={poster} alt="" />
        )}
        <div className={styles.scrim} />
      </div>
      {children && <div className={styles.content}>{children}</div>}
    </section>
  );
}
