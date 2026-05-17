
import { BotConfig, RiskLevel } from './types';

export const TRADING_BOTS: BotConfig[] = [
  { id: '1', name: 'VWAP Mean Reversion', trigger: 'Price ±2σ from VWAP', description: 'Institutional mean reversion for high-liquidity pairings.', active: true, risk: RiskLevel.LOW },
  { id: '2', name: 'Volatility Expansion', trigger: 'BB Squeeze + Vol Expansion', description: 'Breakout capture for regime shifts in major assets.', active: true, risk: RiskLevel.MEDIUM },
  { id: '3', name: 'Trend Liquidity', trigger: '0.5 - 0.618 Fib Retrace', description: 'Captures quality pullbacks in established trend cycles.', active: false, risk: RiskLevel.LOW },
  { id: '4', name: 'Horizontal Scalper', trigger: 'Session Range Extremes', description: 'Micro-range execution within session boundaries.', active: false, risk: RiskLevel.MEDIUM },
  { id: '5', name: 'Liquidity Sweep', trigger: 'Equal H/L + RSI Div', description: 'Fades false liquidity grabs at structural extremes.', active: true, risk: RiskLevel.MEDIUM },
  { id: '6', name: 'Session Open Alpha', trigger: 'Volatility Spike at Open', description: 'Regime-based momentum at major market session starts.', active: true, risk: RiskLevel.HIGH },
  { id: '7', name: 'Funding Arbitrage', trigger: 'Extreme Rates + Price Stall', description: 'Counter-trend capture of over-leveraged positioning.', active: false, risk: RiskLevel.HIGH },
  { id: '8', name: 'Cross-Asset Divergence', trigger: 'ETH/BTC Decoupling', description: 'Inter-market divergence strategy for major alts.', active: false, risk: RiskLevel.LOW },
  { id: '9', name: 'Momentum Scalpel', trigger: '5m / 15m Alignment', description: 'Low timeframe momentum tracking for agile exposure.', active: true, risk: RiskLevel.HIGH },
  { id: '10', name: 'NO-TRADE GUARDIAN', trigger: 'GOVERNANCE LOCK', description: 'Total system circuit breaker. Overrides all execution logic.', active: false, isGuardian: true, risk: RiskLevel.HIGH },
];
