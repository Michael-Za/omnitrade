"""
Technical Analysis Service - Computes real indicators from live OHLCV data.
Replaces all random/mock scanner data with real calculated indicators.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from ..models.market_models import (
    TechnicalIndicators, TrendState, MarketPhase,
    CorrelationData, TokenRotationEntry
)

logger = logging.getLogger(__name__)


class TechnicalAnalysisService:
    """Computes technical indicators from real OHLCV data."""

    @staticmethod
    def compute_atr(high: pd.Series, low: pd.Series, close: pd.Series,
                    period: int = 14) -> pd.Series:
        """Compute Average True Range."""
        tr1 = high - low
        tr2 = abs(high - close.shift(1))
        tr3 = abs(low - close.shift(1))
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        return atr

    @staticmethod
    def compute_bollinger_bands(close: pd.Series, period: int = 20,
                                 std_dev: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
        """Compute Bollinger Bands. Returns (upper, middle, lower, width)."""
        middle = close.rolling(window=period).mean()
        std = close.rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        width = (upper - lower) / middle
        return upper, middle, lower, width

    @staticmethod
    def compute_ema(close: pd.Series, period: int) -> pd.Series:
        """Compute Exponential Moving Average."""
        return close.ewm(span=period, adjust=False).mean()

    @staticmethod
    def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
        """Compute Relative Strength Index."""
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    @staticmethod
    def compute_vwap(high: pd.Series, low: pd.Series,
                     close: pd.Series, volume: pd.Series) -> pd.Series:
        """Compute Volume Weighted Average Price."""
        typical_price = (high + low + close) / 3
        vwap = (typical_price * volume).cumsum() / volume.cumsum()
        return vwap

    @staticmethod
    def compute_macd(close: pd.Series, fast: int = 12, slow: int = 26,
                     signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Compute MACD. Returns (macd_line, signal_line, histogram)."""
        ema_fast = close.ewm(span=fast, adjust=False).mean()
        ema_slow = close.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram

    def compute_indicators(self, df: pd.DataFrame, symbol: str,
                           timeframe: str = "15m") -> TechnicalIndicators:
        """
        Compute all technical indicators from OHLCV DataFrame.
        DataFrame must have columns: open, high, low, close, volume
        """
        if df.empty or len(df) < 50:
            logger.warning(f"Insufficient data for {symbol}: {len(df)} bars")
            return TechnicalIndicators(symbol=symbol, timeframe=timeframe)

        close = df['close']
        high = df['high']
        low = df['low']
        volume = df['volume']

        # ATR
        atr = self.compute_atr(high, low, close)
        atr_pct = (atr / close * 100).iloc[-1] if not atr.empty else 0

        # Bollinger Bands
        bb_upper, bb_middle, bb_lower, bb_width = self.compute_bollinger_bands(close)
        current_bb_width = bb_width.iloc[-1] if not bb_width.empty else 0

        # EMAs
        ema_20 = self.compute_ema(close, 20)
        ema_50 = self.compute_ema(close, 50)

        # RSI
        rsi = self.compute_rsi(close)

        # VWAP
        vwap = self.compute_vwap(high, low, close, volume)

        # MACD
        macd_line, macd_signal, macd_histogram = self.compute_macd(close)

        # Determine volatility regime
        current_atr_pct = atr_pct
        avg_atr_pct = (atr / close * 100).rolling(50).mean().iloc[-1] if len(df) > 50 else current_atr_pct
        volatility = 'HIGH' if current_atr_pct > avg_atr_pct * 1.5 else 'LOW'

        # Determine trend from EMA alignment
        current_ema_20 = ema_20.iloc[-1] if not ema_20.empty else 0
        current_ema_50 = ema_50.iloc[-1] if not ema_50.empty else 0
        current_price = close.iloc[-1]

        if current_ema_20 > current_ema_50 and current_price > current_ema_20:
            trend = TrendState.UP
        elif current_ema_20 < current_ema_50 and current_price < current_ema_20:
            trend = TrendState.DOWN
        else:
            trend = TrendState.NEUTRAL

        # Determine market phase
        rsi_val = rsi.iloc[-1] if not rsi.empty else 50
        bb_position = 0
        if not bb_upper.empty and bb_upper.iloc[-1] != bb_lower.iloc[-1]:
            bb_position = (current_price - bb_lower.iloc[-1]) / (bb_upper.iloc[-1] - bb_lower.iloc[-1])

        if rsi_val < 35 and bb_position < 0.2:
            phase = MarketPhase.ACC
        elif rsi_val > 65 and bb_position > 0.8:
            phase = MarketPhase.DIST
        elif trend == TrendState.UP and rsi_val > 50:
            phase = MarketPhase.EXP
        elif trend == TrendState.DOWN and rsi_val < 50:
            phase = MarketPhase.RESET
        else:
            phase = MarketPhase.ACC

        return TechnicalIndicators(
            symbol=symbol,
            atr_pct=round(current_atr_pct, 4),
            bb_width=round(current_bb_width, 6),
            bb_upper=round(bb_upper.iloc[-1], 6) if not bb_upper.empty else 0,
            bb_lower=round(bb_lower.iloc[-1], 6) if not bb_lower.empty else 0,
            bb_middle=round(bb_middle.iloc[-1], 6) if not bb_middle.empty else 0,
            ema_20=round(current_ema_20, 6),
            ema_50=round(current_ema_50, 6),
            rsi_14=round(rsi_val, 2),
            vwap=round(vwap.iloc[-1], 6) if not vwap.empty else 0,
            macd_line=round(macd_line.iloc[-1], 6) if not macd_line.empty else 0,
            macd_signal=round(macd_signal.iloc[-1], 6) if not macd_signal.empty else 0,
            macd_histogram=round(macd_histogram.iloc[-1], 6) if not macd_histogram.empty else 0,
            volatility=volatility,
            trend=trend,
            phase=phase,
            timeframe=timeframe,
            timestamp=datetime.utcnow()
        )

    def compute_correlation(self, price_dfs: Dict[str, pd.DataFrame],
                            period: int = 30) -> CorrelationData:
        """
        Compute cross-asset correlation matrix from price DataFrames.
        Each key is a symbol, value is a DataFrame with 'close' column.
        """
        if len(price_dfs) < 2:
            return CorrelationData()

        # Align close prices
        closes = {}
        for symbol, df in price_dfs.items():
            if not df.empty and 'close' in df.columns:
                closes[symbol] = df['close'].pct_change().dropna()

        if len(closes) < 2:
            return CorrelationData()

        corr_df = pd.DataFrame(closes)
        corr_matrix = corr_df.corr()

        # Identify clusters using correlation threshold
        symbols = list(corr_matrix.columns)
        cluster_a = []
        cluster_b = []
        assigned = set()

        if 'BTC' in symbols or any('BTC' in s for s in symbols):
            btc_key = [s for s in symbols if 'BTC' in s][0]
            for sym in symbols:
                if sym == btc_key:
                    continue
                if corr_matrix.loc[btc_key, sym] > 0.7:
                    cluster_a.append(sym.replace('/USDT', ''))
                    assigned.add(sym)

        for sym in symbols:
            if sym not in assigned:
                if len(cluster_a) <= len(cluster_b):
                    cluster_a.append(sym.replace('/USDT', ''))
                else:
                    cluster_b.append(sym.replace('/USDT', ''))

        # Compute stress index (average absolute correlation)
        upper_triangle = []
        for i in range(len(symbols)):
            for j in range(i + 1, len(symbols)):
                upper_triangle.append(abs(corr_matrix.iloc[i, j]))

        stress_index = np.mean(upper_triangle) if upper_triangle else 0.0

        # Build pairs dict for top correlations
        pairs = {}
        for i in range(len(symbols)):
            for j in range(i + 1, len(symbols)):
                pair_key = f"{symbols[i].replace('/USDT', '')}-{symbols[j].replace('/USDT', '')}"
                pairs[pair_key] = round(corr_matrix.iloc[i, j], 3)

        return CorrelationData(
            cluster_a=cluster_a[:5],
            cluster_b=cluster_b[:5],
            stress_index=round(stress_index, 3),
            pairs=pairs
        )


# Singleton
ta_service = TechnicalAnalysisService()
