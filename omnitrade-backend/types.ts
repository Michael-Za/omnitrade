
export enum View {
  DASHBOARD = 'DASHBOARD',
  BOTS = 'BOTS',
  INTELLIGENCE = 'INTELLIGENCE',
  GOVERNANCE = 'GOVERNANCE',
  LABS = 'LABS'
}

export enum MarketPhase {
  ACC = 'ACCUMULATION',
  EXP = 'EXPANSION',
  DIST = 'DISTRIBUTION',
  RESET = 'RESET'
}

export enum TrendState {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL'
}

export enum ClockSession {
  ASIA = 'ASIA',
  LONDON = 'LONDON',
  NY = 'NY'
}

export enum GovernanceMode {
  FULL = 'FULL',
  REDUCED = 'REDUCED',
  DEFENSIVE = 'DEFENSIVE',
  STOP = 'STOP'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MED',
  HIGH = 'HIGH'
}

export interface TickerPrice {
  symbol: string;
  price: number;
  change_24h: number;
  change_pct_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  quote_volume_24h: number;
  source: string;
}

export interface TechnicalIndicators {
  atr_pct: number;
  bb_width: number;
  bb_upper: number;
  bb_lower: number;
  bb_middle: number;
  ema_20: number;
  ema_50: number;
  rsi_14: number;
  vwap: number;
  macd_line: number;
  macd_signal: number;
  macd_histogram: number;
  volatility: 'LOW' | 'HIGH';
  trend: TrendState;
  phase: MarketPhase;
  symbol: string;
  timeframe: string;
}

export interface TokenRotation {
  ticker: string;
  strength: number;
  price_usd: number;
  change_pct: number;
  status: 'NEXT_PHASE' | 'TOP_PHASE' | 'WEAKENING' | 'STRONG';
}

export interface CorrelationData {
  cluster_a: string[];
  cluster_b: string[];
  stress_index: number;
  pairs: Record<string, number>;
}

export interface ScannerState {
  volatility: 'LOW' | 'HIGH';
  trend: TrendState;
  phase: MarketPhase;
  clock: ClockSession;
  cycle: 'EARLY' | 'MID' | 'LATE';
  uncertainty: 'LOW' | 'HIGH' | 'CRITICAL';
  rotation?: TokenRotation[];
  correlation?: CorrelationData;
}

export interface BotConfig {
  id: string;
  name: string;
  trigger: string;
  description: string;
  active: boolean;
  risk: RiskLevel;
  isGuardian?: boolean;
  last_triggered?: string;
  pnl?: number;
  win_rate?: number;
  total_trades?: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  bot: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  symbol?: string;
  price?: number;
  details?: Record<string, unknown>;
}

export interface SystemMetrics {
  drawdown: number;
  correlationStress: number;
  exposure: number;
  total_pnl?: number;
  win_rate?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  open_positions?: number;
}

export interface SentimentData {
  symbol: string;
  sentiment_score: number;
  mention_count_24h: number;
  sentiment_trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trending: boolean;
  source: string;
}

export interface MemeCoinAnalysis {
  symbol: string;
  price_usd: number;
  market_cap: number;
  volume_24h: number;
  liquidity: number;
  risk_score: number;
  sentiment: SentimentData | null;
  smart_money_inflow: number;
}

export interface StockData {
  symbol: string;
  price: number;
  change_pct: number;
  volume: number;
  market_cap: number;
  pe_ratio: number | null;
  sector: string;
}
