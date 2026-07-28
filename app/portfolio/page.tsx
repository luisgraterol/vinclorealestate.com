import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/immersive/SmoothScroll';
import Preloader from '@/components/immersive/Preloader';
import Reveal from '@/components/immersive/Reveal';
import RevealText from '@/components/immersive/RevealText';
import ParallaxImage from '@/components/immersive/ParallaxImage';
import VideoLoop from '@/components/immersive/VideoLoop';
import styles from './page.module.css';

const TITLE = 'Haven at The Gulch, Nashville — Portfolio | Vinclo Management';
const DESCRIPTION =
  'Inside Haven at The Gulch: the Nashville residences Vinclo Management operates, and the standard we hold on every property we run. Two units in the Gulch, professionally hosted.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords:
    'short term rental portfolio, Airbnb management Nashville, The Gulch Nashville short term rental, professionally managed vacation rental, STR operator portfolio',
  alternates: { canonical: 'https://vinclorealestate.com/portfolio' },
  openGraph: {
    type: 'website',
    url: 'https://vinclorealestate.com/portfolio',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/portfolio/hero-twilight-courtyard.jpg' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <Preloader />
      <SmoothScroll />
      <Nav />

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroMedia}>
            <Image
              src="/portfolio/hero-twilight-courtyard.jpg"
              alt="The courtyard pool at Haven at The Gulch glowing at dusk, ringed by the building's residences"
              fill
              priority
              quality={85}
              sizes="100vw"
            />
          </div>
          <div className={styles.heroScrim} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.kicker}>Portfolio &middot; Nashville, Tennessee</p>
            <RevealText as="h1" className={styles.heroHeadline} trigger="event">
              Haven at <em>The Gulch</em>
            </RevealText>
            <p className={styles.heroSub}>
              The residences we operate in Nashville, and the standard behind them.
            </p>
          </div>
        </section>

        {/* INTRO */}
        <section className={`vsection ${styles.intro}`}>
          <div className={styles.introGrid}>
            <Reveal>
              <RevealText as="h2" className="section-title">
                Two residences, <em>one standard</em>
              </RevealText>
            </Reveal>
            <Reveal delay={0.1}>
              <p className={styles.introBody}>
                Haven sits in The Gulch, Nashville&apos;s walkable core of restaurants,
                music venues, and murals. We host two residences here, units 426 and
                1017, and run them the way we pitch every owner: priced nightly with
                real data, turned over on an inspection checklist, and answered at
                any hour.
              </p>
              <ul className={styles.facts}>
                <li>The Gulch, Nashville</li>
                <li>Units 426 &amp; 1017</li>
                <li>Pool, gym &amp; courtyard</li>
                <li>Skyline views</li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* THE BUILDING */}
        <section className={styles.sequence}>
          <ParallaxImage
            src="/portfolio/aerial-downtown-context.jpg"
            alt="Aerial view of Haven at The Gulch with the downtown Nashville skyline behind it"
            aspect="wide"
            caption="The Gulch, with downtown beyond"
          />
          <div className={styles.pairGrid}>
            <Reveal variant="fade">
              <ParallaxImage
                src="/portfolio/exterior-entrance-glass.jpg"
                alt="Glass-walled entrance of Haven at The Gulch with the courtyard pool visible above"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 50vw"
              />
            </Reveal>
            <Reveal variant="fade" delay={0.12}>
              <ParallaxImage
                src="/portfolio/exterior-canyon-tower.jpg"
                alt="Haven's facade beside the curved glass tower next door"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 50vw"
              />
            </Reveal>
          </div>
        </section>

        {/* STATEMENT */}
        <section className={styles.statement}>
          <RevealText as="p" className={styles.statementText}>
            A guest&apos;s first impression is the owner&apos;s <em>asset at work</em>
          </RevealText>
        </section>

        {/* THE RESIDENCES */}
        <section className={`vsection ${styles.residences}`}>
          <div className={styles.seqHeader}>
            <RevealText as="h2" className="section-title">
              Inside the <em>residences</em>
            </RevealText>
            <Reveal as="p" className="section-intro" variant="fade" delay={0.12}>
              Floor-to-ceiling light, full kitchens, and the skyline out the window.
            </Reveal>
          </div>
          <ParallaxImage
            src="/portfolio/interior-426-living-skyline.jpg"
            alt="Living room of unit 426 with wide windows over the Nashville skyline"
            aspect="wide"
            caption="Unit 426 · Living"
          />
          <div className={styles.pairGrid}>
            <Reveal variant="fade">
              <ParallaxImage
                src="/portfolio/interior-426-kitchen-city.jpg"
                alt="Kitchen of unit 426 with the city visible past the island"
                aspect="standard"
                sizes="(max-width: 700px) 100vw, 50vw"
                caption="Unit 426 · Kitchen"
              />
            </Reveal>
            <Reveal variant="fade" delay={0.12}>
              <ParallaxImage
                src="/portfolio/interior-1017-kitchen.jpg"
                alt="Kitchen of unit 1017 with stainless appliances and warm wood cabinetry"
                aspect="standard"
                sizes="(max-width: 700px) 100vw, 50vw"
                caption="Unit 1017 · Kitchen"
              />
            </Reveal>
          </div>
        </section>

        {/* VIDEO BREAK */}
        <VideoLoop src="/portfolio/video/loop-skyline.mp4" poster="/portfolio/video/poster-skyline.jpg" minHeight="82vh">
          <p className={styles.videoLine}>The Gulch, from above</p>
        </VideoLoop>

        {/* AMENITIES */}
        <section className={`vsection ${styles.amenities}`}>
          <div className={styles.seqHeader}>
            <RevealText as="h2" className="section-title">
              The building <em>carries its weight</em>
            </RevealText>
            <Reveal as="p" className="section-intro" variant="fade" delay={0.12}>
              A courtyard pool, a gym, and common spaces that photograph the way
              guests hope they will.
            </Reveal>
          </div>
          <div className={styles.pairGridOffset}>
            <Reveal variant="fade">
              <ParallaxImage
                src="/portfolio/courtyard-pool-vertical.jpg"
                alt="Sunlit courtyard pool between Haven's residential wings"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 44vw"
              />
            </Reveal>
            <Reveal variant="fade" delay={0.12}>
              <ParallaxImage
                src="/portfolio/aerial-pool-topdown.jpg"
                alt="The pool deck seen straight down from above, loungers along its edge"
                aspect="standard"
                sizes="(max-width: 700px) 100vw, 52vw"
              />
            </Reveal>
          </div>
        </section>

        {/* NEIGHBORHOOD */}
        <section className={`vsection ${styles.neighborhood}`}>
          <div className={styles.seqHeader}>
            <RevealText as="h2" className="section-title">
              Steps from <em>the Gulch itself</em>
            </RevealText>
            <Reveal as="p" className="section-intro" variant="fade" delay={0.12}>
              Guests walk out the door to murals, hot chicken, and live music.
            </Reveal>
          </div>
          <div className={styles.tripleGrid}>
            <Reveal variant="fade">
              <ParallaxImage
                src="/portfolio/gulch-wings-mural.jpg"
                alt="The What Lifts You wings mural, a block from Haven"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </Reveal>
            <Reveal variant="fade" delay={0.1}>
              <ParallaxImage
                src="/portfolio/gulch-street-scene.jpg"
                alt="A Gulch street corner with restaurants and mid-rise glass"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </Reveal>
            <Reveal variant="fade" delay={0.2}>
              <ParallaxImage
                src="/portfolio/gulch-biscuit-love.jpg"
                alt="Biscuit Love's sign in the morning sun"
                aspect="tall"
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </Reveal>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className={styles.closing}>
          <div className={styles.closingInner}>
            <RevealText as="h2" className={styles.closingHeadline}>
              Your property could <em>run like this</em>
            </RevealText>
            <Reveal as="p" className={styles.closingSub} variant="fade" delay={0.15}>
              Tell us about your place and we&apos;ll show you what professional
              management changes: free, and with no obligation.
            </Reveal>
            <Reveal variant="fade" delay={0.25}>
              <Link href="/#contact" className="btn-primary">
                Request a free consultation <span className="btn-arrow">&#8594;</span>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
