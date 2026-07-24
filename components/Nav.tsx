'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Nav.module.css';

interface NavProps {
  variant?: 'public' | 'auth';
}

export default function Nav({ variant = 'public' }: NavProps) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      const nav = navRef.current;
      if (nav) nav.style.boxShadow = window.scrollY > 40 ? '0 4px 24px rgba(0,0,0,.3)' : '';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav id="site-nav" ref={navRef} className={styles.nav}>
      <a href="/#hero" className={styles.wordmark}>
        <span>
          Vinclo <span className={styles.wordmarkAccent}>Real Estate</span>
        </span>
      </a>
      {variant === 'public' && (
        <>
          <ul className={`${styles.navLinks} ${open ? styles.open : ''}`}>
            <li><a href="/#audience" onClick={() => setOpen(false)}>Guests</a></li>
            <li><a href="/#landlords" onClick={() => setOpen(false)}>Landlords</a></li>
            <li><a href="/#trust" onClick={() => setOpen(false)}>Why Us</a></li>
            <li><a href="/auth/login" onClick={() => setOpen(false)}>Login</a></li>
            <li><a href="/#contact" className={styles.navCta} onClick={() => setOpen(false)}>Contact</a></li>
          </ul>
          <div
            className={styles.hamburger}
            aria-label="Open menu"
            role="button"
            tabIndex={0}
            onClick={() => setOpen(o => !o)}
          >
            <span></span><span></span><span></span>
          </div>
        </>
      )}
    </nav>
  );
}
