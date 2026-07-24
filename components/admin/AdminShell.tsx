'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@lib/supabase/client';
import { logout } from '@lib/auth';
import styles from './AdminShell.module.css';

type ActivePage = 'analyzer' | 'analyses' | 'properties' | 'landlords';

const NAV_ITEMS: { page: ActivePage; href: string; label: string }[] = [
  { page: 'analyzer', href: '/admin/analyzer', label: 'Property Analyzer' },
  { page: 'analyses', href: '/admin/analyses', label: 'Saved Analyses' },
  { page: 'properties', href: '/admin/properties', label: 'Properties' },
  { page: 'landlords', href: '/admin/landlords', label: 'Landlords' },
];

function activePageFromPath(pathname: string): ActivePage {
  const found = NAV_ITEMS.find(item => pathname.startsWith(item.href));
  return found?.page ?? 'analyzer';
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activePage = activePageFromPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user.email ?? '');
    });
  }, []);

  return (
    <div className={styles.adminShell}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarBrand}>
          <a href="/admin/analyzer" className={styles.brandLink}>
            <span className={styles.brandRl}>Vinclo</span>
            <span className={styles.brandName}>Real Estate</span>
          </a>
        </div>

        <nav className={styles.sidebarNav}>
          <a href="/admin/analyzer" className={`${styles.navItem} ${activePage === 'analyzer' ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>
            Property Analyzer
          </a>
          <a href="/admin/analyses" className={`${styles.navItem} ${activePage === 'analyses' ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
            Saved Analyses
          </a>
          <a href="/admin/properties" className={`${styles.navItem} ${activePage === 'properties' ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Properties
          </a>
          <a href="/admin/landlords" className={`${styles.navItem} ${activePage === 'landlords' ? styles.active : ''}`}>
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Landlords
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarEmail}>{email}</div>
          <button className={styles.btnSignout} onClick={logout}>
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.visible : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={styles.adminMain}>
        <div className={styles.mobileBar}>
          <button
            className={styles.hamburger}
            aria-label="Toggle navigation"
            onClick={() => setSidebarOpen(o => !o)}
          >
            <svg viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
          </button>
          <span className={styles.mobileBrand}>Vinclo <span>Real Estate</span></span>
        </div>

        {children}
      </div>
    </div>
  );
}
