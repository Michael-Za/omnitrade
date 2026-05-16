// === Market Data Types ===

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export interface MarketData {
  tickers: MarketTicker[];
  lastUpdated: number;
}

// === Signal Types ===

export interface TradingSignal {
  id: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  source: string;
  agent: string;
  price: number | null;
  timestamp: number;
  reasoning?: string;
}

// === Agent Types ===

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "error" | "analyzing";
  lastAction: string | null;
  tradesExecuted: number;
  successRate: number;
}

// === Trade / Position Types ===

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  status: "open" | "closed";
  entryPrice: number | null;
  currentPrice: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  size: number | null;
  exchange: string | null;
  createdAt: string;
}

// === System Status Types ===

export interface SystemStatus {
  state: "running" | "stopped" | "paused" | "error";
  uptime: number;
  exchangeConnected: boolean;
  activePositions: number;
  totalTrades: number;
  llmAvailable: boolean;
  version: string;
}

// === Balance Types ===

export interface Balance {
  currency: string;
  total: number;
  free: number;
  used: number;
}

// === Daily Target Types ===

export interface DailyTarget {
  date: string;
  status: "active" | "target_approaching" | "target_reached" | "loss_warning" | "loss_limit_hit" | "paused";
  startingBalance: number;
  currentBalance: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalPnlPct: number;
  targetProfitPct: number;
  targetProfitAmount: number;
  maxLossPct: number;
  maxLossAmount: number;
  targetProgressPct: number;
  lossProgressPct: number;
  tradesOpened: number;
  tradesClosed: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  positionAdjustmentFactor: number;
}

// === Exchange Types ===

export interface Exchange {
  id: string;
  name: string;
  type: "cex" | "dex" | "traditional";
  connected: boolean;
  status: "online" | "offline" | "maintenance";
}

// === API Response Types ===

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  timestamp: number;
}
