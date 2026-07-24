'use client';

import { useState } from 'react';
import styles from './AudienceTabs.module.css';

type Panel = 'military' | 'corporate' | 'university';

const TABS: { id: Panel; label: string }[] = [
  { id: 'military', label: 'Military & Gov' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'university', label: 'University' },
];

export default function AudienceTabs() {
  const [active, setActive] = useState<Panel>('military');

  return (
    <>
      <div className={styles.audienceTabs} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.audienceTab} ${active === tab.id ? styles.active : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`${styles.audiencePanel} ${active === 'military' ? styles.active : ''}`}>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/></svg></div>
          <div className={styles.audienceCardTitle}>TDY Personnel</div>
          <p className={styles.audienceCardDesc}>Per diem-friendly rates. Stays from 1 to 29 nights. Smart lock access means no key handoffs. We&apos;re within 15 minutes of Dyess AFB gates.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
          <div className={styles.audienceCardTitle}>Government Contractors</div>
          <p className={styles.audienceCardDesc}>Extended stays for project-based work near Dyess. Full kitchen, high-speed WiFi, and a dedicated workspace built for productive remote work.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <div className={styles.audienceCardTitle}>Short-Notice Bookings</div>
          <p className={styles.audienceCardDesc}>Orders change fast. Our properties stay available year-round with consistent quality &mdash; no surprises on arrival, no degraded units.</p>
        </div>
      </div>

      <div className={`${styles.audiencePanel} ${active === 'corporate' ? styles.active : ''}`}>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
          <div className={styles.audienceCardTitle}>Project Teams</div>
          <p className={styles.audienceCardDesc}>Multi-week assignments near Abilene&apos;s healthcare and energy sectors. Multiple bedrooms available for small teams &mdash; one booking, one contact.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <div className={styles.audienceCardTitle}>Home-Like Comfort</div>
          <p className={styles.audienceCardDesc}>Full kitchen, in-unit laundry, dedicated parking, and premium WiFi. Designed to feel like home after a long workday.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div className={styles.audienceCardTitle}>Corporate Accounts</div>
          <p className={styles.audienceCardDesc}>Recurring business? We offer priority booking for corporate travel coordinators managing repeat stays in the Abilene market.</p>
        </div>
      </div>

      <div className={`${styles.audiencePanel} ${active === 'university' ? styles.active : ''}`}>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
          <div className={styles.audienceCardTitle}>Graduation &amp; Events</div>
          <p className={styles.audienceCardDesc}>Families visiting ACU, Hardin-Simmons, or McMurry for graduation. A full home beats hotel blocks &mdash; more space, a real kitchen, easy parking.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <div className={styles.audienceCardTitle}>Move-In Transitions</div>
          <p className={styles.audienceCardDesc}>Families arriving before the semester who need a base while students get settled. 1&ndash;3 week stays with all essentials already in place.</p>
        </div>
        <div className={styles.audienceCard}>
          <div className={styles.audienceCardIcon}><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div className={styles.audienceCardTitle}>Homecoming Weekends</div>
          <p className={styles.audienceCardDesc}>Annual homecoming draws alumni and families from across Texas. Book early &mdash; these weekends fill fast and our homes deliver far beyond area hotels.</p>
        </div>
      </div>
    </>
  );
}
