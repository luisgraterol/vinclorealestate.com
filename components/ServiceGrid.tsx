import type { ServiceItem } from '@/lib/content/services';
import styles from './ServiceGrid.module.css';

export default function ServiceGrid({ services }: { services: ServiceItem[] }) {
  return (
    <div className={styles.grid}>
      {services.map((s, i) => (
        <div key={s.num} className={`${styles.card} reveal reveal-delay-${(i % 3) + 1}`}>
          <div className={styles.num}>{s.num}</div>
          <div className={styles.name}>{s.name}</div>
          <p className={styles.desc}>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
