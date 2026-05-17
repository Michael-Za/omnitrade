
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

export interface ScannerState {
  volatility: 'LOW' | 'HIGH';
  trend: TrendState;
  phase: MarketPhase;
  clock: ClockSession;
  cycle: 'EARLY' | 'MID' | 'LATE';
  uncertainty: 'LOW' | 'HIGH' | 'CRITICAL';
}

export interface BotConfig {
  id: string;
  name: string;
  trigger: string;
  description: string;
  active: boolean;
  risk: RiskLevel;
  isGuardian?: boolean;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  bot: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface SystemMetrics {
  drawdown: number;
  correlationStress: number;
  exposure: number;
}
