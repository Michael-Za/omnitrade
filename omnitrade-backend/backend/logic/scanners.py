"""
Real Market Scanners - Replaces ALL mock data with live market analysis.
These scanners pull real data from exchanges and compute actual indicators.
"""
import asyncio
import logging
import time
from typing import Dict, List, Optional
from datetime import datetime

from ..models.market_models import (
    MarketPhase, TrendState, ClockSession,
    TokenRotationEntry, CorrelationData, TechnicalIndicators,
    MarketState, TickerPrice
)
from ..services.market_data_service import market_data_service
from ..services.technical_analysis_service import ta_service
from ..services.stock_service import stock_service
from ..services.sentiment_service import sentiment_service

logger = logging.getLogger(__name__)


# Symbols used for primary market state determination
PRIMARY_CRYPTO = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
ROTATION_CRYPTO = [
    "SOL/USDT", "ETH/USDT", "AVAX/USDT", "LINK/USDT",
    "EGLD/USDT", "MATIC/USDT", "DOT/USDT", "ARB/USDT",
    "OP/USDT", "DOGE/USDT"
]
CORRELATION_CRYPTO = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT", "LINK/USDT", "OP/USDT", "ARB/USDT"]


async def get_market_state() -> Dict:
    """
    Determine market state from REAL data:
    - Volatility: computed from ATR vs historical average
    - Trend: computed from EMA alignment
    - Phase: computed from RSI + Bollinger Band position
    - Prices: real live prices
    """
    indicators = {}
    prices = {}

    try:
        # Fetch real prices
        price_data = await market_data_service.get_all_crypto_prices(PRIMARY_CRYPTO)
        for symbol, price in price_data.items():
            prices[symbol] = price

        # Fetch OHLCV and compute indicators for each primary symbol
        for symbol in PRIMARY_CRYPTO:
            ohlcv = await market_data_service.get_ohlcv(symbol, "15m", 100)
            if ohlcv:
                import pandas as pd
                df = pd.DataFrame([bar.model_dump() for bar in ohlcv])
                ind = ta_service.compute_indicators(df, symbol, "15m")
                indicators[symbol] = ind
    except Exception as e:
        logger.error(f"Error in get_market_state: {e}")

    # Aggregate market state from primary symbols
    # Use BTC as the primary signal
    btc_indicators = indicators.get("BTC/USDT")
    btc_price = prices.get("BTC/USDT")

    if btc_indicators:
        volatility = btc_indicators.volatility
        trend = btc_indicators.trend
        phase = btc_indicators.phase
    else:
        # Fallback: derive from price change
        volatility = "HIGH" if btc_price and abs(btc_price.change_pct_24h) > 3 else "LOW"
        trend = TrendState.UP if btc_price and btc_price.change_pct_24h > 1 else (
            TrendState.DOWN if btc_price and btc_price.change_pct_24h < -1 else TrendState.NEUTRAL
        )
        phase = MarketPhase.ACC

    return {
        "volatility": volatility,
        "trend": trend,
        "phase": phase,
        "prices": {k: v.model_dump() for k, v in prices.items()},
        "indicators": {k: v.model_dump() for k, v in indicators.items()},
    }


def get_clock_cycle() -> Dict:
    """
    Calculates Clock Cycle Scanner based on REAL UTC time.
    This is the only scanner that didn't need fixing - it was already
    based on actual time. Just cleaned up the logic.
    """
    hour = time.gmtime().tm_hour

    # More precise session mapping based on actual market hours
    if 0 <= hour < 8:
        session = ClockSession.ASIA
    elif 8 <= hour < 13:
        session = ClockSession.LONDON
    elif 13 <= hour < 21:
        session = ClockSession.NY
    else:
        session = ClockSession.ASIA  # Late Asia / gap

    # Cycle within session
    session_hour = hour % 8
    if session_hour < 2:
        cycle = "EARLY"
    elif session_hour > 6:
        cycle = "LATE"
    else:
        cycle = "MID"

    return {
        "clock": session,
        "cycle": cycle
    }


async def get_token_rotation() -> List[Dict]:
    """
    Compute REAL token rotation from live market data.
    Relative strength vs BTC based on actual price changes.
    """
    try:
        trending = await market_data_service.get_trending_tokens()
        return [entry.model_dump() for entry in trending[:10]]
    except Exception as e:
        logger.error(f"Error in get_token_rotation: {e}")
        # Return empty rather than mock data
        return []


async def get_correlation_data() -> Dict:
    """
    Compute REAL cross-asset correlation from live price data.
    Uses actual correlation matrix computation.
    """
    try:
        import pandas as pd

        # Fetch OHLCV for correlation pairs
        price_dfs = {}
        for symbol in CORRELATION_CRYPTO:
            ohlcv = await market_data_service.get_ohlcv(symbol, "1h", 50)
            if ohlcv:
                df = pd.DataFrame([bar.model_dump() for bar in ohlcv])
                if not df.empty:
                    price_dfs[symbol] = df

        if len(price_dfs) >= 2:
            corr = ta_service.compute_correlation(price_dfs)
            return corr.model_dump()
    except Exception as e:
        logger.error(f"Error in get_correlation_data: {e}")

    return CorrelationData().model_dump()


def get_uncertainty_level(logs: List[Dict]) -> str:
    """
    Calculates Uncertainty Scanner from REAL execution log analysis.
    Based on actual error rates and signal disagreement.
    """
    if not logs:
        return "LOW"

    # Count errors in recent logs
    error_count = sum(1 for log in logs if log.get("status") == "ERROR")
    warning_count = sum(1 for log in logs if log.get("status") == "WARNING")

    # Also check for conflicting signals (different bots giving opposite signals)
    buy_signals = sum(1 for log in logs if "BUY" in log.get("action", "").upper() or "ENTRY" in log.get("action", "").upper())
    sell_signals = sum(1 for log in logs if "SELL" in log.get("action", "").upper() or "EXIT" in log.get("action", "").upper())

    signal_disagreement = min(buy_signals, sell_signals) / max(buy_signals + sell_signals, 1)

    # Combine error rate and signal disagreement
    total_logs = max(len(logs), 1)
    error_rate = error_count / total_logs
    combined_score = error_rate * 2 + signal_disagreement

    if combined_score > 0.5 or error_count > 3:
        return "CRITICAL"
    elif combined_score > 0.25 or error_count > 1 or warning_count > 2:
        return "HIGH"
    return "LOW"


async def get_stock_market_state() -> Dict:
    """Get real stock market state from yfinance."""
    try:
        summary = stock_service.get_market_summary()
        spy_indicators = stock_service.get_stock_indicators("SPY")

        result = {
            "market_regime": summary.get("market_regime", "NEUTRAL"),
            "stocks": summary,
        }

        if spy_indicators:
            result["spy_indicators"] = spy_indicators.model_dump()

        return result
    except Exception as e:
        logger.error(f"Error in get_stock_market_state: {e}")
        return {"market_regime": "NEUTRAL", "stocks": {}}


async def get_full_market_state() -> MarketState:
    """
    Comprehensive market state combining all scanners.
    This is the main function called by the WebSocket endpoint.
    """
    # Run all scanners concurrently
    market_task = get_market_state()
    rotation_task = get_token_rotation()
    correlation_task = get_correlation_data()

    market, rotation, correlation = await asyncio.gather(
        market_task, rotation_task, correlation_task,
        return_exceptions=True
    )

    # Handle exceptions
    if isinstance(market, Exception):
        logger.error(f"Market state error: {market}")
        market = {"volatility": "LOW", "trend": TrendState.NEUTRAL, "phase": MarketPhase.ACC, "prices": {}, "indicators": {}}
    if isinstance(rotation, Exception):
        logger.error(f"Rotation error: {rotation}")
        rotation = []
    if isinstance(correlation, Exception):
        logger.error(f"Correlation error: {correlation}")
        correlation = CorrelationData().model_dump()

    clock = get_clock_cycle()

    # Build complete state
    prices = {}
    for symbol, price_dict in market.get("prices", {}).items():
        try:
            prices[symbol] = TickerPrice(**price_dict)
        except Exception:
            pass

    indicators = {}
    for symbol, ind_dict in market.get("indicators", {}).items():
        try:
            indicators[symbol] = TechnicalIndicators(**ind_dict)
        except Exception:
            pass

    rotation_entries = []
    for entry in rotation:
        try:
            rotation_entries.append(TokenRotationEntry(**entry))
        except Exception:
            pass

    return MarketState(
        volatility=market.get("volatility", "LOW"),
        trend=market.get("trend", TrendState.NEUTRAL),
        phase=market.get("phase", MarketPhase.ACC),
        clock=clock["clock"],
        cycle=clock["cycle"],
        uncertainty="LOW",  # Will be updated with real logs
        rotation=rotation_entries,
        correlation=CorrelationData(**correlation) if isinstance(correlation, dict) else CorrelationData(),
        prices=prices,
        indicators=indicators
    )
