import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Multi-Strategy Engine',
    emoji: '\uD83C\uDFAF',
    description: (
      <>
        9 trading strategies running in parallel — BTC Momentum, Weather EMOS,
        Copy Trader, Market Maker, Kalshi Arbitrage, and more. Each with
        independent risk isolation and configurable edge thresholds.
      </>
    ),
  },
  {
    title: 'AI-Powered Signals',
    emoji: '\uD83E\uDD16',
    description: (
      <>
        Ensemble AI analysis using Claude and Groq for sentiment analysis, signal
        synthesis, and market prediction. Multi-model debate system for
        high-conviction trade decisions.
      </>
    ),
  },
  {
    title: 'Professional Dashboard',
    emoji: '\uD83D\uDCCA',
    description: (
      <>
        Real-time React dashboard with equity curves, 3D globe visualization,
        signal tables, whale tracking, and comprehensive performance analytics.
        Full admin panel for system control.
      </>
    ),
  },
  {
    title: 'Risk Management',
    emoji: '\uD83D\uDEE1\uFE0F',
    description: (
      <>
        Kelly Criterion position sizing, circuit breakers, portfolio concentration
        guards, per-strategy risk limits, and Brier score signal calibration.
        Shadow mode for paper trading.
      </>
    ),
  },
  {
    title: 'Multi-Platform Trading',
    emoji: '\uD83C\uDF10',
    description: (
      <>
        Trade on Polymarket (CLOB SDK + WebSocket) and Kalshi (REST API)
        simultaneously. Cross-platform arbitrage detection and unified order
        execution.
      </>
    ),
  },
  {
    title: 'Production Ready',
    emoji: '\uD83D\uDE80',
    description: (
      <>
        Docker Compose deployment, Redis-backed job queue (SQLite fallback),
        Prometheus metrics, Telegram notifications, and Railway + Vercel
        deployment configs included.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <span className={styles.featureEmoji} role="img">{emoji}</span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
