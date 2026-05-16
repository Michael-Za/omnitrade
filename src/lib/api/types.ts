// ============================================================================
// Omnitrade Unified - Shared Types
// Combines types from both Omnitrade and Vibe-Trading codebases
// ============================================================================

// --- Navigation ---
export type ViewId = 'dashboard' | 'bots' | 'ai-agent' | 'meme-coins' | 'stocks' | 'backtest' | 'shadow-account' | 'settings';

// --- Omnitrade Backend Types ---

export enum MarketPhase {
  ACC = 'ACCUMULATION',
  EXP = 'EXPANSION',
  DIST = 'DISTRIBUTION',
  RESET = 'RESET',
}

export enum TrendState {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL',
}

export enum ClockSession {
  ASIA = 'ASIA',
  LONDON = 'LONDON',
  NY = 'NY',
}

export enum GovernanceMode {
  FULL = 'FULL',
  REDUCED = 'REDUCED',
  DEFENSIVE = 'DEFENSIVE',
  STOP = 'STOP',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MED',
  HIGH = 'HIGH',
}

export interface TickerPrice {
  symbol: string;
  price: number;
  change_24h: number;
  change_pct_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
}

export interface TechnicalIndicators {
  atr_pct: number;
  bb_width: number;
  rsi_14: number;
  vwap: number;
  volatility: 'LOW' | 'HIGH';
  trend: string;
  phase: string;
  ema_20: number;
  ema_50: number;
  macd_histogram: number;
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
  trend: string;
  phase: string;
  clock: string;
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

export interface OmnitradeWSMessage {
  scanners: ScannerState;
  bots: BotConfig[];
  health: number;
  mode: string;
  metrics: SystemMetrics;
  logs: ExecutionLog[];
  prices: Record<string, TickerPrice>;
  indicators: Record<string, TechnicalIndicators>;
  governance_rules: {
    bot_status: string;
    max_risk: string;
    halt_trading: boolean;
    reduce_exposure: boolean;
  };
  timestamp: string;
  data_source: string;
}

// --- Vibe-Trading Backend Types ---

export interface LLMProviderOption {
  name: string;
  label: string;
  api_key_env?: string | null;
  base_url_env: string;
  default_model: string;
  default_base_url: string;
  api_key_required: boolean;
  auth_type?: string;
  login_command?: string | null;
}

export interface LLMSettings {
  provider: string;
  model_name: string;
  base_url: string;
  api_key_env?: string | null;
  api_key_configured: boolean;
  api_key_hint?: string | null;
  api_key_required: boolean;
  temperature: number;
  timeout_seconds: number;
  max_retries: number;
  reasoning_effort: string;
  env_path: string;
  providers: LLMProviderOption[];
}

export interface DataSourceSettings {
  tushare_token_configured: boolean;
  tushare_token_hint?: string | null;
  baostock_supported: boolean;
  baostock_installed: boolean;
  baostock_message: string;
  env_path: string;
}

export interface SessionItem {
  session_id: string;
  title?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  last_attempt_id?: string;
}

export interface MessageItem {
  message_id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
  linked_attempt_id?: string;
  metadata?: Record<string, unknown>;
}

export type AgentMessageType =
  | 'user' | 'thinking' | 'tool_call' | 'tool_result'
  | 'answer' | 'error' | 'run_complete' | 'compact';

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  content: string;
  tool?: string;
  args?: Record<string, string>;
  status?: 'running' | 'ok' | 'error';
  elapsed_ms?: number;
  timestamp: number;
  runId?: string;
  metrics?: Record<string, number>;
  equityCurve?: Array<{ time: string; equity: number | string }>;
  stage?: string;
  shadowId?: string;
}

export interface ToolCallEntry {
  id: string;
  tool: string;
  arguments: Record<string, string>;
  status: 'running' | 'ok' | 'error';
  preview?: string;
  elapsed_ms?: number;
  timestamp: number;
}

export interface RunListItem {
  run_id: string;
  status: string;
  created_at: string;
  prompt?: string;
  total_return?: number;
  sharpe?: number;
  codes?: string[];
  start_date?: string;
  end_date?: string;
}

export interface BacktestMetrics {
  final_value: number;
  total_return: number;
  annual_return: number;
  max_drawdown: number;
  sharpe: number;
  win_rate: number;
  trade_count: number;
  [key: string]: number;
}

export interface EquityPoint {
  time: string;
  equity: string | number;
  drawdown: string | number;
}

export interface ValidationData {
  monte_carlo?: {
    actual_sharpe: number;
    actual_max_dd: number;
    p_value_sharpe: number;
    p_value_max_dd: number;
    simulated_sharpe_mean: number;
    simulated_sharpe_std: number;
    n_simulations: number;
    n_trades: number;
    error?: string;
  };
  bootstrap?: {
    observed_sharpe: number;
    ci_lower: number;
    ci_upper: number;
    median_sharpe: number;
    prob_positive: number;
    confidence: number;
    n_bootstrap: number;
    error?: string;
  };
  walk_forward?: {
    n_windows: number;
    windows: Array<{
      window: number;
      start: string;
      end: string;
      return: number;
      sharpe: number;
      max_dd: number;
      trades: number;
      win_rate: number;
    }>;
    profitable_windows: number;
    consistency_rate: number;
    return_mean: number;
    return_std: number;
    sharpe_mean: number;
    sharpe_std: number;
    error?: string;
  };
}

export interface RunData {
  status: string;
  run_id: string;
  elapsed_seconds?: number;
  run_directory?: string;
  run_stage?: string;
  metrics?: BacktestMetrics;
  validation?: ValidationData;
  equity_curve?: EquityPoint[];
  trade_log?: Array<Record<string, string>>;
  artifacts?: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
    exists: boolean;
  }>;
}

export interface SwarmPreset {
  name: string;
  title: string;
  description: string;
  agent_count: number;
  variables: { name: string; description: string; required: boolean }[];
}

export interface SwarmRunSummary {
  id: string;
  preset_name: string;
  status: string;
  created_at: string;
  task_count: number;
  completed_count: number;
}

// --- Settings (localStorage) ---

export interface AppSettings {
  // Exchange API Keys
  binanceApiKey: string;
  binanceApiSecret: string;
  bybitApiKey: string;
  bybitApiSecret: string;
  okxApiKey: string;
  okxApiSecret: string;
  // LLM
  llmProvider: string;
  llmApiKey: string;
  llmModelName: string;
  llmBaseUrl: string;
  llmTemperature: number;
  llmReasoningEffort: string;
  // Data Sources
  tushareToken: string;
  coingeckoApiKey: string;
  dexscreenerEnabled: boolean;
  // Trading Config
  defaultLeverage: number;
  maxPositionSize: number;
  riskLimitPct: number;
  allowedPairs: string;
  // Notifications
  alertThreshold: number;
  webhookUrl: string;
  // Google Sheets
  googleSheetId: string;
  googleServiceAccountJson: string;
}
