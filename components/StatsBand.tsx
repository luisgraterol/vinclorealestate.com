import { STATS } from '@/lib/content/stats';
import styles from './StatsBand.module.css';

export default function StatsBand() {
  // Only render verified stats — placeholders never ship as real claims.
  const stats = STATS.filter(s => !s.placeholder);
  if (stats.length === 0) return null;

  return (
    <section className={styles.band} aria-label="Vinclo at a glance">
      <div className={styles.inner}>
        {stats.map(s => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.value}>{s.value}</div>
            <div className={styles.label}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
