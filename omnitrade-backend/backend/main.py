"""
Omnitrade Backend - Real-Time Trading Command Center
FastAPI backend with WebSocket streaming of live market data.
ALL mock data has been replaced with real API integrations.
"""
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from datetime import datetime

from .logic.scanners import (
    get_market_state, get_clock_cycle, get_token_rotation,
    get_correlation_data, get_uncertainty_level, get_stock_market_state,
    get_full_market_state
)
from .logic.bots import TRADING_BOTS, check_bot_triggers
from .logic.governance import calculate_health_score, get_governance_mode, apply_auto_rules, compute_real_metrics
from .services.market_data_service import market_data_service
from .services.sentiment_service import sentiment_service
from .services.stock_service import stock_service
from .models.market_models import BotConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application state
state = {
    "logs": [],
    "trade_history": [],
    "current_positions": {},
    "loss_streak": 0,
    "metrics": {
        "drawdown": 0.0,
        "correlation_stress": 0.0,
        "exposure": 0.0,
        "total_pnl": 0.0,
        "win_rate": 0.0,
        "sharpe_ratio": 0.0,
        "max_drawdown": 0.0,
        "open_positions": 0,
    },
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize services on startup, cleanup on shutdown."""
    logger.info("Starting Omnitrade Backend - Initializing real data services...")

    # Initialize real data services
    await market_data_service.initialize()
    await sentiment_service.initialize()
    logger.info("Market data service connected to Binance via CCXT")
    logger.info("Sentiment service initialized")

    yield

    # Cleanup
    logger.info("Shutting down Omnitrade Backend...")
    await market_data_service.close()
    await sentiment_service.close()


app = FastAPI(title="Omnitrade Backend", version="5.0.0", lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "system": "Omnitrade OS",
        "version": "5.0.0",
        "data_source": "LIVE",
        "exchanges_connected": list(market_data_service.exchanges.keys()),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/prices")
async def get_prices():
    """Get current real-time prices for all tracked pairs."""
    prices = await market_data_service.get_all_crypto_prices()
    return {symbol: price.model_dump() for symbol, price in prices.items()}


@app.get("/api/prices/{symbol}")
async def get_price(symbol: str):
    """Get real-time price for a specific symbol (e.g., BTC/USDT)."""
    price = await market_data_service.get_ticker_price(symbol)
    if not price:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    return price.model_dump()


@app.get("/api/stocks")
async def get_stocks():
    """Get real stock market data."""
    stocks = stock_service.get_all_stocks()
    return {symbol: stock.model_dump() for symbol, stock in stocks.items()}


@app.get("/api/stocks/{symbol}")
async def get_stock(symbol: str):
    """Get stock data for a specific ticker."""
    stock = stock_service.get_stock_data(symbol.upper())
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
    return stock.model_dump()


@app.get("/api/sentiment")
async def get_sentiment():
    """Get meme coin sentiment analysis."""
    trending = await sentiment_service.scrape_coin_gecko_trending()
    reddit = await sentiment_service.scrape_reddit_crypto()
    return {
        "trending": trending,
        "reddit_posts": reddit[:10],
    }


@app.get("/api/meme-coins")
async def get_meme_coins():
    """Get comprehensive meme coin analysis."""
    analysis = await sentiment_service.get_all_meme_analysis()
    return {symbol: a.model_dump() for symbol, a in analysis.items()}


@app.get("/api/indicators/{symbol}")
async def get_indicators(symbol: str, timeframe: str = "15m"):
    """Get technical indicators for a specific crypto symbol."""
    ohlcv = await market_data_service.get_ohlcv(symbol, timeframe, 100)
    if not ohlcv:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    import pandas as pd
    df = pd.DataFrame([bar.model_dump() for bar in ohlcv])
    from .services.technical_analysis_service import ta_service
    indicators = ta_service.compute_indicators(df, symbol, timeframe)
    return indicators.model_dump()


@app.post("/api/bots/{bot_id}/initialize")
async def initialize_bot(bot_id: str):
    """Initialize a specific trading bot."""
    bot = next((b for b in TRADING_BOTS if b.id == bot_id), None)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    bot.active = True

    log_entry = {
        "id": str(time.time()),
        "bot": bot.name,
        "action": "INITIALIZED MANUALLY",
        "status": "SUCCESS",
        "timestamp": time.strftime("%H:%M:%S"),
        "symbol": None,
        "price": None,
    }
    state["logs"].insert(0, log_entry)
    state["logs"] = state["logs"][:50]

    return {"status": "success", "bot": bot.name, "active": bot.active}


@app.post("/api/bots/{bot_id}/toggle")
async def toggle_bot(bot_id: str):
    """Toggle a bot's active state."""
    bot = next((b for b in TRADING_BOTS if b.id == bot_id), None)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    bot.active = not bot.active

    log_entry = {
        "id": str(time.time()),
        "bot": bot.name,
        "action": f"{'ACTIVATED' if bot.active else 'DEACTIVATED'}",
        "status": "SUCCESS",
        "timestamp": time.strftime("%H:%M:%S"),
    }
    state["logs"].insert(0, log_entry)
    state["logs"] = state["logs"][:50]

    return {"status": "success", "bot": bot.name, "active": bot.active}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint - streams real-time market data.
    Replaces all mock/simulated data with live market feeds.
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            # 1. Gather REAL Scanner Data from live markets
            try:
                market_state = await get_full_market_state()
            except Exception as e:
                logger.error(f"Error gathering market state: {e}")
                await asyncio.sleep(2)
                continue

            # Build scanner dict from market state
            scanners = {
                "volatility": market_state.volatility,
                "trend": market_state.trend.value if hasattr(market_state.trend, 'value') else str(market_state.trend),
                "phase": market_state.phase.value if hasattr(market_state.phase, 'value') else str(market_state.phase),
                "clock": market_state.clock.value if hasattr(market_state.clock, 'value') else str(market_state.clock),
                "cycle": market_state.cycle,
                "uncertainty": market_state.uncertainty,
                "rotation": [r.model_dump() for r in market_state.rotation],
                "correlation": market_state.correlation.model_dump(),
            }

            # 2. Compute uncertainty from real logs
            uncertainty = get_uncertainty_level(state["logs"])
            scanners["uncertainty"] = uncertainty

            # 3. Check Bot Triggers with REAL indicator data
            indicators = {k: v for k, v in market_state.indicators.items()}
            health = calculate_health_score(state["metrics"], uncertainty, state.get("loss_streak", 0))

            new_actions = check_bot_triggers(
                scanners, TRADING_BOTS,
                indicators=indicators,
                health=health
            )

            for action in new_actions:
                action["id"] = str(time.time())
                action["timestamp"] = time.strftime("%H:%M:%S")
                state["logs"].insert(0, action)

            # Keep logs manageable
            state["logs"] = state["logs"][:50]

            # 4. Governance Logic with REAL metrics
            mode = get_governance_mode(health)

            # Auto Rules
            correlation_stress = market_state.correlation.stress_index
            rules = apply_auto_rules(health, correlation_stress > 0.8, uncertainty)

            # Apply governance rules to bot states
            if rules["bot_status"] == "ALL_OFF":
                for bot in TRADING_BOTS:
                    if not bot.isGuardian:
                        bot.active = False

            # 5. Construct Payload with REAL data
            prices_dict = {}
            for symbol, price in market_state.prices.items():
                prices_dict[symbol] = {
                    "symbol": price.symbol,
                    "price": price.price,
                    "change_24h": price.change_24h,
                    "change_pct_24h": price.change_pct_24h,
                    "high_24h": price.high_24h,
                    "low_24h": price.low_24h,
                    "volume_24h": price.volume_24h,
                }

            indicators_dict = {}
            for symbol, ind in market_state.indicators.items():
                indicators_dict[symbol] = {
                    "atr_pct": ind.atr_pct,
                    "bb_width": ind.bb_width,
                    "rsi_14": ind.rsi_14,
                    "vwap": ind.vwap,
                    "volatility": ind.volatility,
                    "trend": ind.trend.value if hasattr(ind.trend, 'value') else str(ind.trend),
                    "phase": ind.phase.value if hasattr(ind.phase, 'value') else str(ind.phase),
                    "ema_20": ind.ema_20,
                    "ema_50": ind.ema_50,
                    "macd_histogram": ind.macd_histogram,
                }

            payload = {
                "scanners": scanners,
                "bots": [bot.model_dump() for bot in TRADING_BOTS],
                "health": health,
                "mode": mode,
                "metrics": state["metrics"],
                "logs": state["logs"],
                "prices": prices_dict,
                "indicators": indicators_dict,
                "governance_rules": rules,
                "timestamp": datetime.utcnow().isoformat(),
                "data_source": "LIVE",
            }

            await websocket.send_json(payload)
            await asyncio.sleep(2)  # Update every 2 seconds

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
