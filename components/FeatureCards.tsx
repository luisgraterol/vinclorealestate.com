import Icon, { type IconName } from './icons';
import styles from './FeatureCards.module.css';

export interface Feature {
  icon: IconName;
  title: string;
  desc: string;
}

interface Props {
  items: Feature[];
  columns?: 2 | 3 | 4;
  dark?: boolean;
}

export default function FeatureCards({ items, columns = 3, dark = false }: Props) {
  const colClass = columns === 2 ? styles.cols2 : columns === 4 ? styles.cols4 : styles.cols3;
  return (
    <div className={`${styles.grid} ${colClass} ${dark ? styles.dark : ''}`}>
      {items.map((f, i) => (
        <div key={f.title} className={`${styles.card} reveal reveal-delay-${(i % 4) + 1}`}>
          <div className={styles.iconWrap}><Icon name={f.icon} /></div>
          <div className={styles.title}>{f.title}</div>
          <p className={styles.desc}>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
