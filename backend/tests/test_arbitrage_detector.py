from backend.core.arbitrage_detector import ArbitrageDetector


def test_profitable_yes_no_arb():
    d = ArbitrageDetector(fee_pct=0.02)
    op = d.detect_yes_no_arb({"market_id": "m1", "yes_price": 0.40, "no_price": 0.45})
    assert op is not None
    assert op.net_profit > 0
    assert op.kind == "yes_no"


def test_unprofitable_after_fees():
    d = ArbitrageDetector(fee_pct=0.20)
    op = d.detect_yes_no_arb({"market_id": "m1", "yes_price": 0.45, "no_price": 0.45})
    assert op is None  # 1 - 0.9 = 0.1, fee 0.2 -> negative, returns None


def test_no_opportunity_when_sum_high():
    d = ArbitrageDetector()
    op = d.detect_yes_no_arb({"market_id": "m1", "yes_price": 0.50, "no_price": 0.48})
    assert op is None


def test_scan_all_sorted_by_profit():
    d = ArbitrageDetector(fee_pct=0.01)
    markets = [
        {"market_id": "lo", "yes_price": 0.45, "no_price": 0.45},
        {"market_id": "hi", "yes_price": 0.30, "no_price": 0.40},
        {"market_id": "none", "yes_price": 0.60, "no_price": 0.50},
    ]
    ops = d.scan_all(markets)
    assert len(ops) == 2
    assert ops[0].market_id == "hi"


def test_cross_market_arb():
    d = ArbitrageDetector(fee_pct=0.01)
    a = {"market_id": "ma", "event_id": "evt1", "yes_price": 0.40}
    b = {"market_id": "mb", "event_id": "evt1", "no_price": 0.45}
    op = d.detect_cross_market(a, b)
    assert op is not None
    assert op.kind == "cross_market"
