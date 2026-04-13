import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Multi-strategy prediction market bot with 9 trading strategies, AI signal generation,
          real-time dashboards, and professional risk management — targeting Polymarket and Kalshi.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/getting-started/quick-start-trader"
            style={{marginLeft: '1rem'}}>
            I'm a Trader
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/getting-started/quick-start-developer"
            style={{marginLeft: '1rem'}}>
            I'm a Developer
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Documentation for PolyEdge — an AI-powered prediction market trading bot targeting Polymarket and Kalshi with 9 strategies, real-time dashboards, and professional risk management.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
