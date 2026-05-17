
import { BotConfig, RiskLevel } from './types';

export const TRADING_BOTS: BotConfig[] = [
  { id: '1', name: 'VWAP MEAN REVERSION', trigger: 'Price ±2σ from VWAP', description: 'Institutional mean reversion for high-liquidity pairings. Triggers when price deviates >2 ATR from VWAP.', active: true, risk: RiskLevel.LOW },
  { id: '2', name: 'VOLATILITY BREAKOUT', trigger: 'BB Squeeze + Vol Expansion', description: 'Breakout capture for regime shifts. Triggers on Bollinger Band squeeze followed by expansion.', active: true, risk: RiskLevel.MEDIUM },
  { id: '3', name: 'TREND PULLBACK', trigger: '0.5 - 0.618 Fib Retrace', description: 'Captures quality pullbacks in established trends. Triggers when RSI pulls back to 40-50 zone.', active: false, risk: RiskLevel.LOW },
  { id: '4', name: 'RANGE SCALPER', trigger: 'Session Range Extremes', description: 'Micro-range execution within session boundaries. Triggers at BB extremes in low-vol range.', active: false, risk: RiskLevel.MEDIUM },
  { id: '5', name: 'LIQUIDITY SWEEP', trigger: 'Equal H/L + RSI Div', description: 'Fades false liquidity grabs at structural extremes. Triggers on RSI divergence.', active: true, risk: RiskLevel.MEDIUM },
  { id: '6', name: 'SESSION OPEN ALPHA', trigger: 'Volatility Spike at Open', description: 'Regime-based momentum at major market session starts. Triggers on high ATR at session open.', active: true, risk: RiskLevel.HIGH },
  { id: '7', name: 'FUNDING ARBITRAGE', trigger: 'Extreme Rates + Price Stall', description: 'Counter-trend capture of over-leveraged positioning. Triggers on MACD divergence.', active: false, risk: RiskLevel.HIGH },
  { id: '8', name: 'CROSS-ASSET DIVERGENCE', trigger: 'ETH/BTC Decoupling', description: 'Inter-market divergence strategy. Triggers when ETH/BTC correlation breaks down.', active: false, risk: RiskLevel.LOW },
  { id: '9', name: 'MOMENTUM SCALPEL', trigger: '5m / 15m Alignment', description: 'Low timeframe momentum tracking. Triggers on EMA alignment + MACD confirmation.', active: true, risk: RiskLevel.HIGH },
  { id: '10', name: 'NO-TRADE GUARDIAN', trigger: 'GOVERNANCE LOCK', description: 'Total system circuit breaker. Overrides all execution when health drops below threshold.', active: false, isGuardian: true, risk: RiskLevel.HIGH },
];

// Symbols to display in the price ticker
export const CRYPTO_TICKER_SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT',
  'DOGE/USDT', 'PEPE/USDT', 'WIF/USDT', 'LINK/USDT'
];

export const STOCK_TICKER_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA'];
