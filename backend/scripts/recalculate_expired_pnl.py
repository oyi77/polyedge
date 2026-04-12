"""Recalculate PnL for expired trades that have settlement_value but pnl=0.

These trades were incorrectly expired before their market resolutions were checked.
This script recalculates their PnL using the correct calculate_pnl() formula and
updates their result to win/loss/push accordingly, then reconciles BotState.

Usage: python -m backend.scripts.recalculate_expired_pnl [--dry-run]
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.models.database import get_db, Trade, BotState
from backend.core.settlement_helpers import calculate_pnl
from backend.config import settings


def recalculate_expired_trades(dry_run: bool = False):
    db = next(get_db())

    affected = (
        db.query(Trade)
        .filter(
            Trade.result == "expired",
            Trade.settlement_value.isnot(None),
            Trade.pnl == 0,
        )
        .all()
    )

    print(f"Found {len(affected)} expired trades with settlement_value but pnl=0")

    wins = 0
    losses = 0
    pushes = 0
    total_pnl_delta = 0.0

    for trade in affected:
        old_pnl = trade.pnl
        new_pnl = calculate_pnl(trade, trade.settlement_value)

        if new_pnl > 0:
            new_result = "win"
            wins += 1
        elif new_pnl < 0:
            new_result = "loss"
            losses += 1
        else:
            new_result = "push"
            pushes += 1

        total_pnl_delta += new_pnl - old_pnl

        print(
            f"  Trade {trade.id}: {trade.direction} @ {trade.entry_price} "
            f"size={trade.size:.2f} settle={trade.settlement_value} "
            f"pnl: {old_pnl} -> {new_pnl:+.2f} ({new_result})"
        )

        if not dry_run:
            trade.pnl = new_pnl
            trade.result = new_result

    print(f"\nSummary: {wins} wins, {losses} losses, {pushes} pushes")
    print(f"Total PnL change: ${total_pnl_delta:+.2f}")

    if not dry_run:
        db.commit()
        print("Changes committed.")

        _reconcile_bot_state(db)
    else:
        print("DRY RUN — no changes made.")


def _reconcile_bot_state(db):
    from sqlalchemy import func, case

    state = db.query(BotState).first()
    if not state:
        print("No BotState found!")
        return

    real_trades = (
        db.query(
            func.count(Trade.id),
            func.sum(Trade.pnl),
            func.sum(case((Trade.result == "win", 1), else_=0)),
        )
        .filter(Trade.settled == True, Trade.result.in_(("win", "loss")))
        .first()
    )

    trade_count, realized_pnl, win_count = real_trades
    trade_count = trade_count or 0
    realized_pnl = round(realized_pnl or 0.0, 2)
    win_count = win_count or 0

    open_exposure = (
        db.query(func.sum(Trade.size)).filter(Trade.settled == False).scalar()
    ) or 0.0

    correct_bankroll = round(
        settings.INITIAL_BANKROLL + realized_pnl - open_exposure, 2
    )

    print(f"\nBotState reconciliation:")
    print(f"  paper_bankroll: {state.paper_bankroll} -> {correct_bankroll}")
    print(f"  paper_pnl: {state.paper_pnl} -> {realized_pnl}")
    print(f"  paper_trades: {state.paper_trades} -> {trade_count}")
    print(f"  paper_wins: {state.paper_wins} -> {win_count}")

    state.paper_bankroll = correct_bankroll
    state.paper_pnl = realized_pnl
    state.paper_trades = trade_count
    state.paper_wins = win_count
    db.commit()
    print("BotState reconciled.")


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    recalculate_expired_trades(dry_run=dry)
