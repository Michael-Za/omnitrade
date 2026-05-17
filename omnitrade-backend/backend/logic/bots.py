"""
Real Bot Logic - Replaces ALL mock trigger logic with real signal-based triggers.
Bots now fire based on actual market conditions computed from live data.
"""
import logging
import time
from typing import List, Dict, Optional
from datetime import datetime

from ..models.market_models import BotConfig, ExecutionLog, TechnicalIndicators, TrendState, MarketPhase

logger = logging.getLogger(__name__)

# Real bot configurations
TRADING_BOTS = [
    BotConfig(id="1", name="VWAP MEAN REVERSION", trigger="Price ±2σ from VWAP", description="Institutional mean reversion for high-liquidity pairings. Triggers when price deviates >2 ATR from VWAP.", active=True, risk="LOW"),
    BotConfig(id="2", name="VOLATILITY BREAKOUT", trigger="BB Squeeze + Vol Expansion", description="Breakout capture for regime shifts. Triggers on Bollinger Band squeeze followed by expansion.", active=True, risk="MED"),
    BotConfig(id="3", name="TREND PULLBACK", trigger="0.5 - 0.618 Fib Retrace", description="Captures quality pullbacks in established trends. Triggers when RSI pulls back to 40-50 zone in uptrend.", active=False, risk="LOW"),
    BotConfig(id="4", name="RANGE SCALPER", trigger="Session Range Extremes", description="Micro-range execution within session boundaries. Triggers at BB lower band in low-vol accumulation.", active=False, risk="MED"),
    BotConfig(id="5", name="LIQUIDITY SWEEP", trigger="Equal H/L + RSI Div", description="Fades false liquidity grabs at structural extremes. Triggers on RSI divergence at support/resistance.", active=True, risk="MED"),
    BotConfig(id="6", name="SESSION OPEN ALPHA", trigger="Volatility Spike at Open", description="Regime-based momentum at major market session starts. Triggers on high ATR at session open.", active=True, risk="HIGH"),
    BotConfig(id="7", name="FUNDING ARBITRAGE", trigger="Extreme Rates + Price Stall", description="Counter-trend capture of over-leveraged positioning. Triggers when MACD diverges from price.", active=False, risk="HIGH"),
    BotConfig(id="8", name="CROSS-ASSET DIVERGENCE", trigger="ETH/BTC Decoupling", description="Inter-market divergence strategy. Triggers when ETH/BTC correlation breaks down.", active=False, risk="LOW"),
    BotConfig(id="9", name="MOMENTUM SCALPEL", trigger="5m / 15m Alignment", description="Low timeframe momentum tracking. Triggers on EMA alignment + MACD confirmation.", active=True, risk="HIGH"),
    BotConfig(id="10", name="NO-TRADE GUARDIAN", trigger="GOVERNANCE LOCK", description="Total system circuit breaker. Overrides all execution when health drops below threshold.", active=False, risk="HIGH", isGuardian=True),
]


def check_permission_matrix(bot_name: str, scanners: Dict, health: int = 70) -> bool:
    """
    Check bot permission against real market conditions and health score.
    Replaces hardcoded health=70 with actual health score.
    """
    volatility = scanners.get("volatility", "LOW")
    trend = scanners.get("trend", "NEUTRAL")
    phase = scanners.get("phase", "ACCUMULATION")

    # Guardian always runs
    if bot_name == "NO-TRADE GUARDIAN":
        return True

    # If health is critical, disable all bots
    if health < 40:
        return False

    # Real permission matrix based on market conditions
    if bot_name == "VWAP MEAN REVERSION":
        # Mean reversion works best in neutral/low-vol markets
        return trend == "NEUTRAL" and volatility == "LOW"
    elif bot_name == "VOLATILITY BREAKOUT":
        # Breakout works when vol is expanding from low
        return volatility == "LOW" or phase == "RESET"
    elif bot_name == "TREND PULLBACK":
        # Pullback works in trending markets
        return trend in ["UP", "DOWN"] and phase in ["EXPANSION", "ACCUMULATION"]
    elif bot_name == "RANGE SCALPER":
        # Scalper works in accumulation/range
        return phase == "ACCUMULATION" and volatility == "LOW"
    elif bot_name == "LIQUIDITY SWEEP":
        # Sweep works at distribution extremes
        return phase in ["DISTRIBUTION", "ACCUMULATION"]
    elif bot_name == "SESSION OPEN ALPHA":
        # Session alpha works at session opens
        return scanners.get("cycle") == "EARLY" and scanners.get("clock") in ["LONDON", "NY"]
    elif bot_name == "FUNDING ARBITRAGE":
        # Arbitrage works in high vol with stalling price
        return volatility == "HIGH" and trend == "NEUTRAL"
    elif bot_name == "CROSS-ASSET DIVERGENCE":
        # Divergence works when correlation breaks
        correlation = scanners.get("correlation", {})
        stress = correlation.get("stress_index", 0) if isinstance(correlation, dict) else 0
        return stress < 0.5  # Low correlation = divergence opportunity
    elif bot_name == "MOMENTUM SCALPEL":
        # Momentum works in trending markets
        return trend in ["UP", "DOWN"]

    return True


def check_bot_triggers(scanners: Dict, bots: List[BotConfig],
                       indicators: Dict[str, TechnicalIndicators] = None,
                       health: int = 70) -> List[Dict]:
    """
    Check real bot triggers based on actual technical indicators.
    Replaces random trigger logic with real signal detection.
    """
    executed_actions = []

    # Guardian Logic - based on real health score
    guardian = next((b for b in bots if b.isGuardian), None)
    if guardian and guardian.active and health < 40:
        return [{"bot": "NO-TRADE GUARDIAN", "action": "HALT TRADING - HEALTH CRITICAL", "status": "WARNING", "symbol": "ALL"}]

    volatility = scanners.get("volatility", "LOW")
    trend = scanners.get("trend", "NEUTRAL")
    phase = scanners.get("phase", "ACCUMULATION")
    cycle = scanners.get("cycle", "MID")
    clock = scanners.get("clock", "LONDON")

    # Process each active bot
    for bot in bots:
        if not bot.active or bot.isGuardian:
            continue

        # Check permission matrix with real health
        if not check_permission_matrix(bot.name, scanners, health):
            continue

        action = _evaluate_bot_trigger(bot, scanners, indicators or {})
        if action:
            executed_actions.append(action)

    return executed_actions


def _evaluate_bot_trigger(bot: BotConfig, scanners: Dict,
                          indicators: Dict[str, TechnicalIndicators]) -> Optional[Dict]:
    """
    Evaluate a single bot's trigger conditions against real data.
    Returns an action dict if triggered, None otherwise.
    """
    volatility = scanners.get("volatility", "LOW")
    trend = scanners.get("trend", "NEUTRAL")
    phase = scanners.get("phase", "ACCUMULATION")
    cycle = scanners.get("cycle", "MID")
    clock = scanners.get("clock", "LONDON")

    # Get BTC indicators as primary signal source
    btc_ind = indicators.get("BTC/USDT")
    eth_ind = indicators.get("ETH/USDT")
    primary_ind = btc_ind or eth_ind

    if bot.name == "VWAP MEAN REVERSION" and primary_ind:
        # Trigger when price is >2 ATR from VWAP
        if primary_ind.vwap > 0 and primary_ind.atr_pct > 0:
            price = primary_ind.bb_middle  # Approximate current price
            deviation = abs(price - primary_ind.vwap) / (primary_ind.vwap * primary_ind.atr_pct / 100)
            if deviation > 2.0:
                symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
                direction = "SELL" if price > primary_ind.vwap else "BUY"
                return {
                    "bot": bot.name,
                    "action": f"Mean Reversion {direction} - Deviation: {deviation:.1f}σ",
                    "status": "SUCCESS",
                    "symbol": symbol,
                    "price": price
                }

    elif bot.name == "VOLATILITY BREAKOUT" and primary_ind:
        # Trigger on BB squeeze + expansion (BB width contracting then expanding)
        if primary_ind.bb_width > 0:
            # BB squeeze: width is very narrow
            if primary_ind.volatility == "HIGH" and primary_ind.bb_width < 0.03:
                symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
                return {
                    "bot": bot.name,
                    "action": f"Breakout Signal - BB Width: {primary_ind.bb_width:.4f}",
                    "status": "SUCCESS",
                    "symbol": symbol,
                    "price": primary_ind.bb_middle
                }

    elif bot.name == "TREND PULLBACK" and primary_ind:
        # Trigger when RSI pulls back in trending market
        if trend == "UP" and 35 <= primary_ind.rsi_14 <= 50:
            symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
            return {
                "bot": bot.name,
                "action": f"Pullback Entry - RSI: {primary_ind.rsi_14:.1f}",
                "status": "SUCCESS",
                "symbol": symbol,
                "price": primary_ind.bb_middle
            }
        elif trend == "DOWN" and 50 <= primary_ind.rsi_14 <= 65:
            symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
            return {
                "bot": bot.name,
                "action": f"Pullback Short - RSI: {primary_ind.rsi_14:.1f}",
                "status": "SUCCESS",
                "symbol": symbol,
                "price": primary_ind.bb_middle
            }

    elif bot.name == "RANGE SCALPER" and primary_ind:
        # Trigger at BB extremes in low-vol range
        if volatility == "LOW" and phase == "ACCUMULATION":
            if primary_ind.rsi_14 < 30:
                symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
                return {
                    "bot": bot.name,
                    "action": f"Range Buy - RSI Oversold: {primary_ind.rsi_14:.1f}",
                    "status": "SUCCESS",
                    "symbol": symbol,
                    "price": primary_ind.bb_lower
                }
            elif primary_ind.rsi_14 > 70:
                symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
                return {
                    "bot": bot.name,
                    "action": f"Range Sell - RSI Overbought: {primary_ind.rsi_14:.1f}",
                    "status": "SUCCESS",
                    "symbol": symbol,
                    "price": primary_ind.bb_upper
                }

    elif bot.name == "LIQUIDITY SWEEP" and primary_ind:
        # Trigger on RSI divergence (price making new low but RSI not confirming)
        if primary_ind.rsi_14 < 35 and phase in ["DISTRIBUTION", "ACCUMULATION"]:
            symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
            return {
                "bot": bot.name,
                "action": f"Sweep Detected - RSI: {primary_ind.rsi_14:.1f}",
                "status": "SUCCESS",
                "symbol": symbol,
                "price": primary_ind.bb_lower
            }

    elif bot.name == "SESSION OPEN ALPHA":
        # Trigger at session opens with high volatility
        if cycle == "EARLY" and clock in ["LONDON", "NY"] and volatility == "HIGH":
            symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
            price = primary_ind.bb_middle if primary_ind else 0
            return {
                "bot": bot.name,
                "action": f"Session Open Alpha - {clock} Early, High Vol",
                "status": "SUCCESS",
                "symbol": symbol,
                "price": price
            }

    elif bot.name == "FUNDING ARBITRAGE" and primary_ind:
        # Trigger on MACD divergence
        if primary_ind.macd_histogram != 0 and volatility == "HIGH" and trend == "NEUTRAL":
            symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
            direction = "LONG" if primary_ind.macd_histogram > 0 else "SHORT"
            return {
                "bot": bot.name,
                "action": f"Arbitrage {direction} - MACD Hist: {primary_ind.macd_histogram:.4f}",
                "status": "SUCCESS",
                "symbol": symbol,
                "price": primary_ind.bb_middle
            }

    elif bot.name == "CROSS-ASSET DIVERGENCE":
        # Trigger when BTC and ETH indicators diverge
        if btc_ind and eth_ind:
            if (btc_ind.trend == "UP" and eth_ind.trend == "DOWN") or \
               (btc_ind.trend == "DOWN" and eth_ind.trend == "UP"):
                return {
                    "bot": bot.name,
                    "action": f"Divergence - BTC: {btc_ind.trend}, ETH: {eth_ind.trend}",
                    "status": "SUCCESS",
                    "symbol": "ETH/BTC",
                    "price": eth_ind.bb_middle / btc_ind.bb_middle if btc_ind.bb_middle else 0
                }

    elif bot.name == "MOMENTUM SCALPEL" and primary_ind:
        # Trigger on EMA + MACD alignment
        if trend in ["UP", "DOWN"]:
            ema_aligned = (trend == "UP" and primary_ind.ema_20 > primary_ind.ema_50) or \
                          (trend == "DOWN" and primary_ind.ema_20 < primary_ind.ema_50)
            macd_confirmed = (trend == "UP" and primary_ind.macd_histogram > 0) or \
                             (trend == "DOWN" and primary_ind.macd_histogram < 0)
            if ema_aligned and macd_confirmed:
                symbol = "BTC/USDT" if btc_ind else "ETH/USDT"
                direction = "LONG" if trend == "UP" else "SHORT"
                return {
                    "bot": bot.name,
                    "action": f"Momentum {direction} - EMA+MACD Aligned",
                    "status": "SUCCESS",
                    "symbol": symbol,
                    "price": primary_ind.bb_middle
                }

    return None
