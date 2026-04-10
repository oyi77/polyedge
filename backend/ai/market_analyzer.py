"""AI market analyzer with multi-provider routing for prediction markets."""
import asyncio
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Optional

from backend.ai.logger import get_ai_logger

logger = logging.getLogger("trading_bot.ai")


@dataclass
class AIAnalysis:
    probability: float
    confidence: float
    reasoning: str
    provider: str
    cost_usd: float


def _build_prompt(
    question: str,
    current_price: float,
    volume: float,
    category: str = "",
    context: str = "",
) -> str:
    prompt = f"""Analyze this prediction market:
Question: {question}
Current YES price: ${current_price}
Volume: ${volume}
Category: {category}"""
    if context:
        prompt += f"\nContext: {context}"
    prompt += """

Estimate the TRUE probability of YES outcome.
Return your analysis as:
PROBABILITY: [0.0 to 1.0]
CONFIDENCE: [0.0 to 1.0]
REASONING: [brief explanation]"""
    return prompt


def _parse_ai_response(response: str) -> tuple[float, float, str]:
    """Parse PROBABILITY/CONFIDENCE/REASONING text or JSON from an LLM response."""
    start = response.find('{')
    if start != -1:
        try:
            decoder = json.JSONDecoder()
            data, _ = decoder.raw_decode(response, start)
            prob = float(data.get("probability", data.get("prob", 0.5)))
            conf = float(data.get("confidence", data.get("conf", 0.0)))
            reasoning = str(data.get("reasoning", data.get("reason", response)))
            prob = max(0.0, min(1.0, prob))
            conf = max(0.0, min(1.0, conf))
            return (prob, conf, reasoning)
        except (ValueError, KeyError):
            pass

    prob: Optional[float] = None
    conf: Optional[float] = None
    reasoning = ""

    prob_match = re.search(r'PROBABILITY:\s*(-?[\d.]+)', response, re.IGNORECASE)
    if prob_match:
        try:
            prob = max(0.0, min(1.0, float(prob_match.group(1))))
        except ValueError:
            pass

    conf_match = re.search(r'CONFIDENCE:\s*(-?[\d.]+)', response, re.IGNORECASE)
    if conf_match:
        try:
            conf = max(0.0, min(1.0, float(conf_match.group(1))))
        except ValueError:
            pass

    reasoning_match = re.search(r'REASONING:\s*(.+)', response, re.IGNORECASE | re.DOTALL)
    if reasoning_match:
        reasoning = reasoning_match.group(1).strip()

    if prob is not None and conf is not None:
        return (prob, conf, reasoning or response)

    return (0.5, 0.0, response)


async def _call_groq(prompt: str) -> Optional[str]:
    start_time = time.time()
    try:
        from backend.config import settings
        from groq import Groq

        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("GROQ_API_KEY not configured")
            return None

        model = settings.GROQ_MODEL
        client = Groq(api_key=api_key)
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.2,
        )

        result = response.choices[0].message.content.strip()
        latency_ms = (time.time() - start_time) * 1000
        tokens_used = response.usage.total_tokens if response.usage else 0

        ai_logger = get_ai_logger()
        ai_logger.log_call(
            provider="groq",
            model=model,
            prompt=prompt,
            response=result,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            call_type="market_analysis",
            success=True,
        )

        return result

    except ImportError:
        logger.error("groq package not installed")
        return None
    except Exception as e:
        logger.error(f"Groq market analysis failed: {e}")
        latency_ms = (time.time() - start_time) * 1000
        try:
            from backend.config import settings
            ai_logger = get_ai_logger()
            ai_logger.log_call(
                provider="groq",
                model=settings.GROQ_MODEL,
                prompt=prompt,
                response="",
                latency_ms=latency_ms,
                tokens_used=0,
                call_type="market_analysis",
                success=False,
                error=str(e),
            )
        except Exception:
            pass
        return None


async def _call_claude(prompt: str) -> Optional[str]:
    start_time = time.time()
    model = "claude-sonnet-4-20250514"
    try:
        from backend.config import settings
        import anthropic

        api_key = settings.ANTHROPIC_API_KEY if hasattr(settings, "ANTHROPIC_API_KEY") else None
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not configured")
            return None

        client = anthropic.Anthropic(api_key=api_key)
        message = await asyncio.to_thread(
            client.messages.create,
            model=model,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )

        result = message.content[0].text
        latency_ms = (time.time() - start_time) * 1000
        tokens_used = message.usage.input_tokens + message.usage.output_tokens

        ai_logger = get_ai_logger()
        ai_logger.log_call(
            provider="claude",
            model=model,
            prompt=prompt,
            response=result,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            call_type="market_analysis",
            success=True,
        )

        return result

    except ImportError:
        logger.error("anthropic package not installed")
        return None
    except Exception as e:
        logger.error(f"Claude market analysis failed: {e}")
        latency_ms = (time.time() - start_time) * 1000
        try:
            ai_logger = get_ai_logger()
            ai_logger.log_call(
                provider="claude",
                model=model,
                prompt=prompt,
                response="",
                latency_ms=latency_ms,
                tokens_used=0,
                call_type="market_analysis",
                success=False,
                error=str(e),
            )
        except Exception:
            pass
        return None


async def check_ai_budget() -> dict:
    """Return current AI spend vs daily budget."""
    from backend.config import settings

    ai_logger = get_ai_logger()
    stats = ai_logger.get_daily_stats()
    spent = stats.get("total_cost_usd", 0.0)
    limit = settings.AI_DAILY_BUDGET_USD
    remaining = max(0.0, limit - spent)

    return {
        "spent_today": spent,
        "limit": limit,
        "remaining": remaining,
        "can_call": spent < limit,
    }


async def analyze_market(
    question: str,
    current_price: float,
    volume: float,
    category: str = "",
    context: str = "",
) -> Optional[AIAnalysis]:
    """Analyze a market: screen with Groq, escalate to Claude if edge > 5%."""
    budget = await check_ai_budget()
    if not budget["can_call"]:
        logger.warning(
            f"AI daily budget exceeded (${budget['spent_today']:.4f} / ${budget['limit']:.2f})"
        )
        return None

    prompt = _build_prompt(question, current_price, volume, category, context)

    groq_response = await _call_groq(prompt)
    if groq_response is None:
        return None

    groq_prob, groq_conf, groq_reasoning = _parse_ai_response(groq_response)
    if groq_conf == 0.0 and groq_prob == 0.5:
        logger.warning("Failed to parse Groq response")
        return None

    groq_edge = abs(groq_prob - current_price)

    if groq_edge <= 0.05:
        ai_logger = get_ai_logger()
        daily_stats = ai_logger.get_daily_stats()
        cost = daily_stats.get("total_cost_usd", 0.0)
        return AIAnalysis(
            probability=groq_prob,
            confidence=groq_conf,
            reasoning=groq_reasoning,
            provider="groq",
            cost_usd=cost,
        )

    budget = await check_ai_budget()
    if not budget["can_call"]:
        logger.warning("Budget exhausted before Claude escalation, returning Groq result")
        return AIAnalysis(
            probability=groq_prob,
            confidence=groq_conf,
            reasoning=groq_reasoning,
            provider="groq",
            cost_usd=budget["spent_today"],
        )

    claude_response = await _call_claude(prompt)
    if claude_response is None:
        return AIAnalysis(
            probability=groq_prob,
            confidence=groq_conf,
            reasoning=groq_reasoning,
            provider="groq",
            cost_usd=budget["spent_today"],
        )

    claude_prob, claude_conf, claude_reasoning = _parse_ai_response(claude_response)
    if claude_conf == 0.0 and claude_prob == 0.5:
        return AIAnalysis(
            probability=groq_prob,
            confidence=groq_conf,
            reasoning=groq_reasoning,
            provider="groq",
            cost_usd=budget["spent_today"],
        )

    final_budget = await check_ai_budget()
    return AIAnalysis(
        probability=claude_prob,
        confidence=claude_conf,
        reasoning=claude_reasoning,
        provider="claude",
        cost_usd=final_budget["spent_today"],
    )
