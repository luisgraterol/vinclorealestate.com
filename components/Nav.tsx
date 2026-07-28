'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './Nav.module.css';

interface NavProps {
  variant?: 'public' | 'auth';
}

const LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/auth/login', label: 'Login' },
];

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
      <Link href="/" className={styles.wordmark}>
        <span>
          Vinclo <span className={styles.wordmarkAccent}>Real Estate</span>
        </span>
      </Link>
      {variant === 'public' && (
        <>
          <ul className={`${styles.navLinks} ${open ? styles.open : ''}`}>
            {LINKS.map(l => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/#contact" className={styles.navCta} onClick={() => setOpen(false)}>Contact</Link>
            </li>
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
