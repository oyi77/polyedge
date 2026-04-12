"""Self-research pipeline for PolyEdge AGI."""

from __future__ import annotations

import asyncio
import hashlib
import logging

import feedparser

from backend.research.models import ResearchItem

logger = logging.getLogger("trading_bot")

DEFAULT_RSS_FEEDS = [
    "https://polymarket.com/feed.xml",
    "https://metaculus.com/feed/",
]


class ResearchPipeline:
    def __init__(self):
        self._seen_fingerprints: set[str] = set()

    def _fingerprint(self, title: str, source: str) -> str:
        return hashlib.sha256((title + source).encode()).hexdigest()

    async def run_research_cycle(
        self, markets: list[str] | None = None
    ) -> list[ResearchItem]:
        items: list[ResearchItem] = []

        items.extend(await self._fetch_rss_feeds())

        if markets:
            items.extend(await self._search_bigbrain(markets))

        # In-cycle dedup via fingerprint set
        deduped: list[ResearchItem] = []
        cycle_fps: set[str] = set()
        for item in items:
            if item.fingerprint not in cycle_fps:
                cycle_fps.add(item.fingerprint)
                deduped.append(item)

        scored = await self._score_items(deduped)

        result = [it for it in scored if it.relevance_score > 0.3]
        result.sort(key=lambda it: it.relevance_score, reverse=True)
        return result

    async def _fetch_rss_feeds(self) -> list[ResearchItem]:
        from backend.config import settings

        feeds = getattr(settings, "RESEARCH_RSS_FEEDS", None) or DEFAULT_RSS_FEEDS
        items: list[ResearchItem] = []

        for url in feeds:
            try:
                loop = asyncio.get_event_loop()
                feed = await loop.run_in_executor(None, feedparser.parse, url)
                for entry in feed.entries:
                    title = getattr(entry, "title", "") or ""
                    link = getattr(entry, "link", "") or ""
                    summary = (getattr(entry, "summary", "") or "")[:500]
                    source = url
                    fp = self._fingerprint(title, source)
                    items.append(
                        ResearchItem(
                            title=title,
                            source=source,
                            content=summary,
                            relevance_score=0.0,
                            url=link,
                            fingerprint=fp,
                        )
                    )
            except Exception as exc:
                logger.warning("RSS fetch failed for %s: %s", url, exc)

        return items

    async def _search_bigbrain(self, markets: list[str]) -> list[ResearchItem]:
        items: list[ResearchItem] = []
        try:
            from backend.clients.bigbrain import BigBrainClient

            brain = BigBrainClient()
            for query in markets:
                try:
                    results = await brain.search_context(query)
                    for r in results:
                        text = r.get("text", r.get("content", ""))[:500]
                        title = text[:120] if text else query
                        fp = self._fingerprint(title, "bigbrain")
                        items.append(
                            ResearchItem(
                                title=title,
                                source="bigbrain",
                                content=text,
                                relevance_score=0.0,
                                url="",
                                fingerprint=fp,
                            )
                        )
                except Exception as exc:
                    logger.warning("BigBrain search failed for '%s': %s", query, exc)
        except Exception as exc:
            logger.warning("BigBrain client init failed: %s", exc)

        return items

    async def _score_items(self, items: list[ResearchItem]) -> list[ResearchItem]:
        if not items:
            return items

        try:
            from backend.ai.llm_router import LLMRouter

            router = LLMRouter()
            for item in items:
                try:
                    prompt = (
                        "Rate the relevance of this headline to prediction markets "
                        "(politics, economics, crypto, sports, weather) on a 0-1 scale.\n"
                        f"Title: {item.title}\n"
                        'Respond with JSON: {"score": <float>}'
                    )
                    result = await router.complete_json(prompt, role="default")
                    score = float(result.get("score", 0.5))
                    item.relevance_score = max(0.0, min(1.0, score))
                except Exception:
                    item.relevance_score = 0.5
        except Exception as exc:
            logger.warning("LLM scoring unavailable, defaulting to 0.5: %s", exc)
            for item in items:
                item.relevance_score = 0.5

        return items


# Backward-compat alias used by orchestrator, api/agents, agents/pipeline
AutonomousResearchPipeline = ResearchPipeline
