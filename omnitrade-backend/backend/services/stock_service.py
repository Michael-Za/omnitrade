"""
Stock Market Data Service - Real stock data via yfinance.
Provides stock pricing, technical indicators, and sector analysis.
"""
import logging
import time
from typing import Dict, List, Optional
from datetime import datetime

import yfinance as yf
import pandas as pd
import numpy as np

from ..models.market_models import StockData, TechnicalIndicators, TrendState, MarketPhase
from .technical_analysis_service import ta_service

logger = logging.getLogger(__name__)

DEFAULT_STOCK_TICKERS = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "GOOGL", "META", "AMD"]


class StockService:
    """Real-time stock market data service using yfinance."""

    def __init__(self):
        self.stock_cache: Dict[str, StockData] = {}
        self.indicator_cache: Dict[str, TechnicalIndicators] = {}
        self.last_update: float = 0
        self.update_interval: int = 60  # seconds

    def get_stock_data(self, symbol: str) -> Optional[StockData]:
        """Fetch comprehensive stock data for a symbol."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}
            hist = ticker.history(period="5d")

            if hist.empty:
                return None

            current = hist.iloc[-1]
            prev = hist.iloc[-2] if len(hist) > 1 else current

            close = current['Close']
            prev_close = prev['Close']
            change_pct = ((close - prev_close) / prev_close * 100) if prev_close != 0 else 0

            stock = StockData(
                symbol=symbol,
                price=round(float(close), 2),
                change_pct=round(float(change_pct), 2),
                volume=float(current['Volume']),
                market_cap=info.get('marketCap', 0),
                pe_ratio=info.get('trailingPE'),
                sector=info.get('sector', 'Unknown'),
                timestamp=datetime.utcnow()
            )

            self.stock_cache[symbol] = stock
            return stock

        except Exception as e:
            logger.error(f"Error fetching stock {symbol}: {e}")
            return self.stock_cache.get(symbol)

    def get_stock_indicators(self, symbol: str, interval: str = "1h",
                              period: str = "3mo") -> Optional[TechnicalIndicators]:
        """Compute technical indicators for a stock."""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)

            if hist.empty or len(hist) < 50:
                logger.warning(f"Insufficient data for {symbol}: {len(hist)} bars")
                return None

            # Rename columns to match our expected format
            df = hist.rename(columns={
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })

            indicators = ta_service.compute_indicators(df, symbol, interval)
            self.indicator_cache[symbol] = indicators
            return indicators

        except Exception as e:
            logger.error(f"Error computing indicators for {symbol}: {e}")
            return self.indicator_cache.get(symbol)

    def get_all_stocks(self, symbols: List[str] = None) -> Dict[str, StockData]:
        """Fetch data for all tracked stocks."""
        symbols = symbols or DEFAULT_STOCK_TICKERS
        results = {}

        for symbol in symbols:
            data = self.get_stock_data(symbol)
            if data:
                results[symbol] = data

        self.last_update = time.time()
        return results

    def get_all_stock_indicators(self, symbols: List[str] = None) -> Dict[str, TechnicalIndicators]:
        """Compute indicators for all tracked stocks."""
        symbols = symbols or DEFAULT_STOCK_TICKERS
        results = {}

        for symbol in symbols:
            indicators = self.get_stock_indicators(symbol)
            if indicators:
                results[symbol] = indicators

        return results

    def get_market_summary(self) -> Dict:
        """Get overall stock market summary (SPY, QQQ as proxies)."""
        summary = {}
        for symbol in ["SPY", "QQQ", "VIX"]:
            data = self.get_stock_data(symbol)
            if data:
                summary[symbol] = {
                    "price": data.price,
                    "change_pct": data.change_pct,
                    "volume": data.volume,
                    "sector": data.sector,
                }

        # Determine overall market regime from SPY
        spy_data = self.stock_cache.get("SPY")
        if spy_data:
            if spy_data.change_pct > 0.5:
                summary["market_regime"] = "RISK_ON"
            elif spy_data.change_pct < -0.5:
                summary["market_regime"] = "RISK_OFF"
            else:
                summary["market_regime"] = "NEUTRAL"
        else:
            summary["market_regime"] = "NEUTRAL"

        return summary


# Singleton
stock_service = StockService()
