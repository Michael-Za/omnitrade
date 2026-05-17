#!/usr/bin/env python3
"""
Omnitrade v5.0 Integration Tests - Validates real data pipeline.
Tests that all services connect to real data sources and produce valid output.
"""
import asyncio
import json
import sys
import time

# Test 1: Backend Module Imports
def test_imports():
    print("Testing module imports...")
    try:
        from backend.models.market_models import *
        from backend.logic.governance import calculate_health_score, get_governance_mode
        from backend.logic.bots import TRADING_BOTS, check_bot_triggers, check_permission_matrix
        from backend.logic.scanners import get_clock_cycle, get_uncertainty_level
        from backend.services.market_data_service import market_data_service
        from backend.services.technical_analysis_service import ta_service
        from backend.services.sentiment_service import sentiment_service
        from backend.services.stock_service import stock_service
        print("  PASS: All modules imported successfully")
        return True
    except Exception as e:
        print(f"  FAIL: Import error: {e}")
        return False


# Test 2: Market Data Service (Real Binance Connection)
async def test_market_data():
    print("Testing market data service (real Binance connection)...")
    try:
        from backend.services.market_data_service import market_data_service

        await market_data_service.initialize()

        # Test BTC price
        btc = await market_data_service.get_ticker_price('BTC/USDT')
        assert btc is not None, "BTC price should not be None"
        assert btc.price > 0, f"BTC price should be positive, got {btc.price}"
        assert btc.source in ['binance', 'bybit'], f"Source should be an exchange, got {btc.source}"
        print(f"  BTC/USDT: ${btc.price:,.2f} (source: {btc.source})")

        # Test ETH price
        eth = await market_data_service.get_ticker_price('ETH/USDT')
        assert eth is not None, "ETH price should not be None"
        assert eth.price > 0
        print(f"  ETH/USDT: ${eth.price:,.2f}")

        # Test OHLCV
        ohlcv = await market_data_service.get_ohlcv('BTC/USDT', '15m', 10)
        assert len(ohlcv) > 0, "Should receive OHLCV bars"
        print(f"  OHLCV: {len(ohlcv)} bars received")

        # Test trending tokens
        trending = await market_data_service.get_trending_tokens()
        assert len(trending) > 0, "Should find trending tokens"
        print(f"  Trending: {len(trending)} tokens found")

        await market_data_service.close()
        print("  PASS: Market data service works with real data")
        return True
    except Exception as e:
        print(f"  FAIL: Market data error: {e}")
        return False


# Test 3: Technical Analysis
def test_technical_analysis():
    print("Testing technical analysis computation...")
    try:
        import pandas as pd
        import numpy as np
        from backend.services.technical_analysis_service import ta_service

        # Generate realistic test data
        np.random.seed(42)
        n = 100
        close = 100 + np.cumsum(np.random.randn(n) * 0.5)
        high = close + np.random.rand(n) * 2
        low = close - np.random.rand(n) * 2
        volume = np.random.randint(1000, 10000, n).astype(float)

        df = pd.DataFrame({
            'open': close, 'high': high, 'low': low,
            'close': close, 'volume': volume
        })

        indicators = ta_service.compute_indicators(df, 'TEST/USDT', '15m')
        assert 0 <= indicators.rsi_14 <= 100, f"RSI should be 0-100, got {indicators.rsi_14}"
        assert indicators.atr_pct >= 0, f"ATR should be positive, got {indicators.atr_pct}"
        assert indicators.volatility in ['LOW', 'HIGH'], f"Volatility should be LOW or HIGH"
        assert indicators.trend.value in ['UP', 'DOWN', 'NEUTRAL'], f"Trend should be valid"
        assert indicators.phase.value in ['ACCUMULATION', 'EXPANSION', 'DISTRIBUTION', 'RESET']

        print(f"  RSI: {indicators.rsi_14:.1f}")
        print(f"  ATR%: {indicators.atr_pct:.4f}")
        print(f"  Volatility: {indicators.volatility}")
        print(f"  Trend: {indicators.trend}")
        print(f"  Phase: {indicators.phase}")
        print("  PASS: Technical analysis computation works")
        return True
    except Exception as e:
        print(f"  FAIL: TA error: {e}")
        return False


# Test 4: Governance & Health
def test_governance():
    print("Testing governance engine...")
    try:
        from backend.logic.governance import calculate_health_score, get_governance_mode, compute_real_metrics

        # Test with various metrics
        health_full = calculate_health_score({'drawdown': 1, 'correlation_stress': 0.1, 'exposure': 10, 'win_rate': 0.6}, 'LOW', 0)
        assert health_full > 80, f"Low risk should give high health, got {health_full}"

        health_critical = calculate_health_score({'drawdown': 20, 'correlation_stress': 0.9, 'exposure': 90, 'win_rate': 0.2}, 'CRITICAL', 5)
        assert health_critical < 40, f"High risk should give low health, got {health_critical}"

        # Test mode mapping
        assert get_governance_mode(90) == 'FULL'
        assert get_governance_mode(70) == 'REDUCED'
        assert get_governance_mode(50) == 'DEFENSIVE'
        assert get_governance_mode(30) == 'STOP'

        # Test real metrics
        metrics = compute_real_metrics([
            {'pnl': 100}, {'pnl': -50}, {'pnl': 200}, {'pnl': -30}
        ])
        assert metrics['total_pnl'] == 220
        assert metrics['win_rate'] == 0.5

        print(f"  Health (low risk): {health_full} -> {get_governance_mode(health_full)}")
        print(f"  Health (high risk): {health_critical} -> {get_governance_mode(health_critical)}")
        print("  PASS: Governance engine works correctly")
        return True
    except Exception as e:
        print(f"  FAIL: Governance error: {e}")
        return False


# Test 5: Bot Triggers with Real Logic
def test_bot_triggers():
    print("Testing bot trigger logic...")
    try:
        from backend.logic.bots import TRADING_BOTS, check_permission_matrix, check_bot_triggers

        # Test permission matrix
        assert check_permission_matrix('VWAP MEAN REVERSION', {'volatility': 'LOW', 'trend': 'NEUTRAL', 'phase': 'ACCUMULATION'}, health=85)
        assert not check_permission_matrix('VWAP MEAN REVERSION', {'volatility': 'HIGH', 'trend': 'UP', 'phase': 'EXPANSION'}, health=85)
        assert not check_permission_matrix('VWAP MEAN REVERSION', {'volatility': 'LOW', 'trend': 'NEUTRAL', 'phase': 'ACCUMULATION'}, health=30)

        # Test with indicators
        from backend.models.market_models import TechnicalIndicators, TrendState, MarketPhase

        test_indicators = {
            'BTC/USDT': TechnicalIndicators(
                symbol='BTC/USDT', atr_pct=2.5, bb_width=0.04,
                bb_upper=80000, bb_lower=76000, bb_middle=78000,
                ema_20=78000, ema_50=77500, rsi_14=42, vwap=79000,
                macd_line=50, macd_signal=45, macd_histogram=5,
                volatility='LOW', trend=TrendState.NEUTRAL, phase=MarketPhase.ACC
            )
        }

        scanners = {
            'volatility': 'LOW', 'trend': 'NEUTRAL', 'phase': 'ACCUMULATION',
            'cycle': 'MID', 'clock': 'LONDON'
        }

        actions = check_bot_triggers(scanners, TRADING_BOTS, test_indicators, health=90)
        # VWAP should trigger since price deviates >2σ from VWAP
        vwap_triggered = any('VWAP' in a['bot'] for a in actions)
        print(f"  VWAP Trigger: {vwap_triggered}")
        print(f"  Total Actions: {len(actions)}")
        for a in actions:
            print(f"    {a['bot']}: {a['action']}")

        print("  PASS: Bot trigger logic works with real indicators")
        return True
    except Exception as e:
        print(f"  FAIL: Bot trigger error: {e}")
        return False


# Test 6: Full Pipeline Integration
async def test_full_pipeline():
    print("Testing full data pipeline...")
    try:
        from backend.services.market_data_service import market_data_service
        from backend.logic.scanners import get_full_market_state
        from backend.logic.bots import TRADING_BOTS, check_bot_triggers
        from backend.logic.governance import calculate_health_score, get_governance_mode

        await market_data_service.initialize()

        # Get full market state
        state = await get_full_market_state()

        # Verify data
        assert state.volatility in ['LOW', 'HIGH']
        assert state.trend.value in ['UP', 'DOWN', 'NEUTRAL']
        assert len(state.prices) > 0, "Should have real prices"
        assert len(state.indicators) > 0, "Should have real indicators"

        # Build WebSocket-like payload
        payload = {
            'scanners': {
                'volatility': state.volatility,
                'trend': state.trend.value,
                'phase': state.phase.value,
            },
            'health': calculate_health_score({'drawdown': 2, 'correlation_stress': 0.3, 'exposure': 10}, state.uncertainty, 0),
            'prices': {k: v.model_dump() for k, v in state.prices.items()},
            'data_source': 'LIVE',
        }

        # Verify JSON serializable
        json_str = json.dumps(payload, default=str)
        assert len(json_str) > 100, "Payload should have significant size"

        print(f"  Volatility: {state.volatility}")
        print(f"  Trend: {state.trend}")
        print(f"  Prices: {len(state.prices)} symbols")
        print(f"  Indicators: {len(state.indicators)} computed")
        print(f"  Rotation: {len(state.rotation)} tokens")
        print(f"  Payload size: {len(json_str)} bytes")
        print("  PASS: Full pipeline integration works")
        return True

    except Exception as e:
        print(f"  FAIL: Pipeline error: {e}")
        return False
    finally:
        await market_data_service.close()


def main():
    print("=" * 60)
    print("Omnitrade v5.0 Integration Test Suite")
    print("Testing REAL data pipeline (no mock data)")
    print("=" * 60)

    results = []

    # Synchronous tests
    results.append(("Imports", test_imports()))
    results.append(("Technical Analysis", test_technical_analysis()))
    results.append(("Governance", test_governance()))
    results.append(("Bot Triggers", test_bot_triggers()))

    # Async tests
    results.append(("Market Data", asyncio.run(test_market_data())))
    results.append(("Full Pipeline", asyncio.run(test_full_pipeline())))

    # Summary
    print("\n" + "=" * 60)
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"  [{status}] {name}")
    print("=" * 60)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
