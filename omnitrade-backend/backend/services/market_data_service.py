"""
Real-time Market Data Service using CCXT for crypto and yfinance for stocks.
Provides unified access to live market data from Binance, other exchanges, and stock APIs.
"""
import asyncio
import logging
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta

import ccxt.async_support as ccxt
import yfinance as yf
import pandas as pd
import numpy as np

from ..models.market_models import (
    TickerPrice, OHLCVBar, TechnicalIndicators,
    TokenRotationEntry, TrendState, MarketPhase
)

logger = logging.getLogger(__name__)

# Default trading pairs for scanning
CRYPTO_PAIRS = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT",
    "LINK/USDT", "DOT/USDT", "MATIC/USDT", "ARB/USDT",
    "OP/USDT", "EGLD/USDT", "DOGE/USDT", "SHIB/USDT",
    "PEPE/USDT", "WIF/USDT", "BONK/USDT"
]

STOCK_TICKERS = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA"]


class MarketDataService:
    """
    Unified real-time market data service.
    Supports crypto (via CCXT/Binance) and stocks (via yfinance).
    """

    def __init__(self):
        self.exchanges: Dict[str, ccxt.Exchange] = {}
        self.price_cache: Dict[str, TickerPrice] = {}
        self.indicator_cache: Dict[str, TechnicalIndicators] = {}
        self.last_update: Dict[str, float] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize exchange connections."""
        try:
            # Binance - primary crypto data source
            self.exchanges["binance"] = ccxt.binance({
                'enableRateLimit': True,
                'options': {'defaultType': 'spot'},
            })
            logger.info("Connected to Binance via CCXT")
        except Exception as e:
            logger.error(f"Failed to connect to Binance: {e}")

        try:
            # Bybit as fallback
            self.exchanges["bybit"] = ccxt.bybit({
                'enableRateLimit': True,
            })
            logger.info("Connected to Bybit via CCXT")
        except Exception as e:
            logger.warning(f"Failed to connect to Bybit: {e}")

        self._initialized = True

    async def close(self):
        """Close all exchange connections."""
        for name, exchange in self.exchanges.items():
            try:
                await exchange.close()
                logger.info(f"Closed {name} connection")
            except Exception as e:
                logger.error(f"Error closing {name}: {e}")

    def _get_primary_exchange(self) -> Optional[ccxt.Exchange]:
        """Get the primary (first available) exchange."""
        for name in ["binance", "bybit"]:
            if name in self.exchanges:
                return self.exchanges[name]
        return None

    async def get_ticker_price(self, symbol: str, exchange_name: str = "binance") -> Optional[TickerPrice]:
        """Fetch real-time ticker price for a symbol."""
        exchange = self.exchanges.get(exchange_name)
        if not exchange:
            exchange = self._get_primary_exchange()
        if not exchange:
            logger.warning("No exchange available for ticker price")
            return None

        try:
            ticker = await exchange.fetch_ticker(symbol)
            price_data = TickerPrice(
                symbol=symbol,
                price=ticker.get('last', 0),
                change_24h=ticker.get('change', 0),
                change_pct_24h=ticker.get('percentage', 0) or 0,
                high_24h=ticker.get('high', 0),
                low_24h=ticker.get('low', 0),
                volume_24h=ticker.get('baseVolume', 0),
                quote_volume_24h=ticker.get('quoteVolume', 0),
                timestamp=datetime.utcnow(),
                source=exchange_name
            )
            self.price_cache[symbol] = price_data
            self.last_update[symbol] = time.time()
            return price_data
        except Exception as e:
            logger.error(f"Error fetching ticker {symbol}: {e}")
            # Return cached data if available
            return self.price_cache.get(symbol)

    async def get_all_crypto_prices(self, symbols: List[str] = None) -> Dict[str, TickerPrice]:
        """Fetch real-time prices for all tracked crypto pairs."""
        symbols = symbols or CRYPTO_PAIRS
        results = {}

        # Batch fetch with rate limiting
        tasks = []
        for symbol in symbols:
            tasks.append(self.get_ticker_price(symbol))

        ticker_results = await asyncio.gather(*tasks, return_exceptions=True)

        for symbol, result in zip(symbols, ticker_results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching {symbol}: {result}")
                if symbol in self.price_cache:
                    results[symbol] = self.price_cache[symbol]
            elif result is not None:
                results[symbol] = result

        return results

    def get_stock_price(self, symbol: str) -> Optional[Dict]:
        """Fetch stock data via yfinance (synchronous)."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="2d")

            if hist.empty:
                return None

            current = hist.iloc[-1]
            prev = hist.iloc[-2] if len(hist) > 1 else current

            return {
                "symbol": symbol,
                "price": float(current['Close']),
                "change_pct": ((current['Close'] - prev['Close']) / prev['Close'] * 100) if prev['Close'] else 0,
                "volume": float(current['Volume']),
                "market_cap": info.get('marketCap', 0),
                "pe_ratio": info.get('trailingPE'),
                "sector": info.get('sector', ''),
                "high": float(current['High']),
                "low": float(current['Low']),
            }
        except Exception as e:
            logger.error(f"Error fetching stock {symbol}: {e}")
            return None

    async def get_ohlcv(self, symbol: str, timeframe: str = "15m",
                        limit: int = 100, exchange_name: str = "binance") -> List[OHLCVBar]:
        """Fetch OHLCV data for technical analysis."""
        exchange = self.exchanges.get(exchange_name)
        if not exchange:
            exchange = self._get_primary_exchange()
        if not exchange:
            return []

        try:
            ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            bars = []
            for candle in ohlcv:
                bars.append(OHLCVBar(
                    timestamp=datetime.utcfromtimestamp(candle[0] / 1000),
                    open=candle[1],
                    high=candle[2],
                    low=candle[3],
                    close=candle[4],
                    volume=candle[5]
                ))
            return bars
        except Exception as e:
            logger.error(f"Error fetching OHLCV {symbol}: {e}")
            return []

    async def get_stock_ohlcv(self, symbol: str, period: str = "3mo",
                              interval: str = "15m") -> pd.DataFrame:
        """Fetch stock OHLCV data via yfinance."""
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            return df
        except Exception as e:
            logger.error(f"Error fetching stock OHLCV {symbol}: {e}")
            return pd.DataFrame()

    async def get_trending_tokens(self, exchange_name: str = "binance") -> List[TokenRotationEntry]:
        """Get trending tokens based on volume and price changes."""
        exchange = self.exchanges.get(exchange_name)
        if not exchange:
            exchange = self._get_primary_exchange()
        if not exchange:
            return []

        try:
            tickers = await exchange.fetch_tickers()
            btc_price = None

            # Get BTC price for relative strength calculation
            if 'BTC/USDT' in tickers:
                btc_price = tickers['BTC/USDT'].get('last', 0)

            entries = []
            for symbol, ticker_data in tickers.items():
                if not symbol.endswith('/USDT'):
                    continue

                pct_change = ticker_data.get('percentage', 0) or 0
                volume = ticker_data.get('quoteVolume', 0) or 0

                # Filter: only tokens with significant volume
                if volume < 1_000_000:
                    continue

                # Calculate relative strength vs BTC
                btc_change = tickers.get('BTC/USDT', {}).get('percentage', 0) or 0
                relative_strength = pct_change - btc_change

                status = 'STRONG'
                if relative_strength > 5:
                    status = 'NEXT_PHASE'
                elif relative_strength > 2:
                    status = 'TOP_PHASE'
                elif relative_strength < -5:
                    status = 'WEAKENING'

                base_symbol = symbol.replace('/USDT', '')

                entries.append(TokenRotationEntry(
                    ticker=base_symbol,
                    strength=round(relative_strength, 2),
                    price_usd=ticker_data.get('last', 0),
                    change_pct=round(pct_change, 2),
                    status=status
                ))

            # Sort by strength descending
            entries.sort(key=lambda x: x.strength, reverse=True)
            return entries[:20]

        except Exception as e:
            logger.error(f"Error fetching trending tokens: {e}")
            return []


# Singleton instance
market_data_service = MarketDataService()
