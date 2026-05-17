"""
Data models for real market data across the Omnitrade system.
All models use Pydantic for validation and serialization.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from enum import Enum
from datetime import datetime


class MarketPhase(str, Enum):
    ACC = 'ACCUMULATION'
    EXP = 'EXPANSION'
    DIST = 'DISTRIBUTION'
    RESET = 'RESET'


class TrendState(str, Enum):
    UP = 'UP'
    DOWN = 'DOWN'
    NEUTRAL = 'NEUTRAL'


class ClockSession(str, Enum):
    ASIA = 'ASIA'
    LONDON = 'LONDON'
    NY = 'NY'


class GovernanceMode(str, Enum):
    FULL = 'FULL'
    REDUCED = 'REDUCED'
    DEFENSIVE = 'DEFENSIVE'
    STOP = 'STOP'


class RiskLevel(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MED'
    HIGH = 'HIGH'


class TickerPrice(BaseModel):
    """Real-time price data for a single ticker."""
    symbol: str
    price: float
    change_24h: float = 0.0
    change_pct_24h: float = 0.0
    high_24h: float = 0.0
    low_24h: float = 0.0
    volume_24h: float = 0.0
    quote_volume_24h: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = "binance"


class OHLCVBar(BaseModel):
    """Single OHLCV candlestick bar."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class TechnicalIndicators(BaseModel):
    """Computed technical indicators for a symbol."""
    symbol: str
    atr_pct: float = 0.0
    bb_width: float = 0.0
    bb_upper: float = 0.0
    bb_lower: float = 0.0
    bb_middle: float = 0.0
    ema_20: float = 0.0
    ema_50: float = 0.0
    rsi_14: float = 50.0
    vwap: float = 0.0
    macd_line: float = 0.0
    macd_signal: float = 0.0
    macd_histogram: float = 0.0
    volatility: Literal['LOW', 'HIGH'] = 'LOW'
    trend: TrendState = TrendState.NEUTRAL
    phase: MarketPhase = MarketPhase.ACC
    timeframe: str = "15m"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TokenRotationEntry(BaseModel):
    """Token rotation data: relative strength vs BTC."""
    ticker: str
    strength: float
    price_usd: float = 0.0
    change_pct: float = 0.0
    status: Literal['NEXT_PHASE', 'TOP_PHASE', 'WEAKENING', 'STRONG'] = 'STRONG'


class CorrelationData(BaseModel):
    """Cross-asset correlation data."""
    cluster_a: List[str] = []
    cluster_b: List[str] = []
    stress_index: float = 0.0
    pairs: Dict[str, float] = {}


class MarketState(BaseModel):
    """Complete market state from scanners."""
    volatility: Literal['LOW', 'HIGH'] = 'LOW'
    trend: TrendState = TrendState.NEUTRAL
    phase: MarketPhase = MarketPhase.ACC
    clock: ClockSession = ClockSession.LONDON
    cycle: Literal['EARLY', 'MID', 'LATE'] = 'MID'
    uncertainty: Literal['LOW', 'HIGH', 'CRITICAL'] = 'LOW'
    rotation: List[TokenRotationEntry] = []
    correlation: CorrelationData = Field(default_factory=CorrelationData)
    prices: Dict[str, TickerPrice] = {}
    indicators: Dict[str, TechnicalIndicators] = {}


class BotConfig(BaseModel):
    """Bot configuration with real trigger conditions."""
    id: str
    name: str
    trigger: str
    description: str
    active: bool = False
    risk: RiskLevel = RiskLevel.MEDIUM
    isGuardian: bool = False
    last_triggered: Optional[datetime] = None
    pnl: float = 0.0
    win_rate: float = 0.0
    total_trades: int = 0


class ExecutionLog(BaseModel):
    """Single execution log entry."""
    id: str
    bot: str
    action: str
    status: Literal['SUCCESS', 'WARNING', 'ERROR']
    timestamp: str
    symbol: Optional[str] = None
    price: Optional[float] = None
    details: Optional[Dict] = None


class SystemMetrics(BaseModel):
    """Real system performance metrics."""
    drawdown: float = 0.0
    correlation_stress: float = 0.0
    exposure: float = 0.0
    total_pnl: float = 0.0
    win_rate: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    open_positions: int = 0


class SentimentData(BaseModel):
    """Social sentiment data for meme coin analysis."""
    symbol: str
    sentiment_score: float = 0.0  # -1 to 1
    mention_count_24h: int = 0
    sentiment_trend: Literal['BULLISH', 'BEARISH', 'NEUTRAL'] = 'NEUTRAL'
    trending: bool = False
    source: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MemeCoinAnalysis(BaseModel):
    """Comprehensive meme coin analysis."""
    symbol: str
    price_usd: float = 0.0
    market_cap: float = 0.0
    volume_24h: float = 0.0
    liquidity: float = 0.0
    holders_count: int = 0
    is_honeypot: Optional[bool] = None
    buy_tax: Optional[float] = None
    sell_tax: Optional[float] = None
    sentiment: Optional[SentimentData] = None
    risk_score: float = 0.0  # 0-100, higher = riskier
    smart_money_inflow: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StockData(BaseModel):
    """Stock market data via yfinance."""
    symbol: str
    price: float = 0.0
    change_pct: float = 0.0
    volume: float = 0.0
    market_cap: float = 0.0
    pe_ratio: Optional[float] = None
    sector: str = ""
    indicators: Optional[TechnicalIndicators] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
