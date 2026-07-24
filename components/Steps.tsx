import type { Step } from '@/lib/content/services';
import styles from './Steps.module.css';

export default function Steps({ steps, light = false }: { steps: Step[]; light?: boolean }) {
  return (
    <div className={`${styles.steps} ${light ? styles.light : ''}`}>
      {steps.map((s, i) => (
        <div key={s.num} className={`${styles.step} reveal reveal-delay-${(i % 4) + 1}`}>
          <div className={styles.num}>{s.num}</div>
          <div className={styles.title}>{s.title}</div>
          <p className={styles.desc}>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
