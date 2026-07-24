import { PROPERTIES, type Property } from '@/lib/content/properties';
import Icon from './icons';
import styles from './PropertyGrid.module.css';

function Card({ p, index }: { p: Property; index: number }) {
  return (
    <div className={`${styles.card} reveal reveal-delay-${(index % 3) + 1}`}>
      <div className={styles.media}>
        {p.placeholder && <span className={styles.badge}>Sample listing</span>}
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={p.title} loading="lazy" />
        ) : (
          <div className={styles.mediaEmpty}><Icon name="home" /></div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.loc}>{p.location}</div>
        <div className={styles.title}>{p.title}</div>
        <div className={styles.specs}>
          <span className={styles.spec}><Icon name="bed" /> {p.beds} bd</span>
          <span className={styles.spec}><Icon name="bath" /> {p.baths} ba</span>
          <span className={styles.spec}><Icon name="guests" /> {p.sleeps}</span>
        </div>
        <div className={styles.tags}>
          {p.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
        <div className={styles.action}>
          {p.airbnbUrl ? (
            <a className={styles.book} href={p.airbnbUrl} target="_blank" rel="noopener noreferrer">
              Book on Airbnb <span>&#8594;</span>
            </a>
          ) : (
            <span className={styles.soon}>Listing coming soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertyGrid({ limit }: { limit?: number }) {
  const items = limit ? PROPERTIES.slice(0, limit) : PROPERTIES;
  return (
    <div className={styles.grid}>
      {items.map((p, i) => <Card key={p.id} p={p} index={i} />)}
    </div>
  );
}
