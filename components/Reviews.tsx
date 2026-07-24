import { REVIEWS } from '@/lib/content/reviews';
import Icon from './icons';
import styles from './Reviews.module.css';

export default function Reviews() {
  // Only real reviews ship — placeholders are never shown.
  const reviews = REVIEWS.filter(r => !r.placeholder);
  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className={`${styles.section} vsection`}>
      <div className={`${styles.header} reveal`}>
        <div className="section-label center">Guest Reviews</div>
        <h2 className="section-title">Straight from <em>our guests</em></h2>
        <p className="section-intro" style={{ margin: '0 auto' }}>
          Every quote below is a real, unedited review from a recent stay.
        </p>
      </div>
      <div className={styles.grid}>
        {reviews.map((r, i) => (
          <div key={i} className={`${styles.card} reveal reveal-delay-${(i % 3) + 1}`}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, s) => <Icon key={s} name="star" />)}
            </div>
            <p className={styles.quote}>&ldquo;{r.quote}&rdquo;</p>
            <div className={styles.meta}>
              <span className={styles.guest}>{r.guest}{r.property ? ` · ${r.property}` : ''}</span>
              <span className={styles.date}>{r.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
