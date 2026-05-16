"use client";

import { create } from "zustand";
import type { Agent, Exchange, DailyTarget, Position } from "@/types/trading";

interface TradingStore {
  // Simulation mode
  simulationMode: boolean;
  toggleSimulationMode: () => void;

  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Exchanges
  exchanges: Exchange[];
  setExchanges: (exchanges: Exchange[]) => void;

  // Daily target
  dailyTarget: DailyTarget | null;
  setDailyTarget: (target: DailyTarget | null) => void;

  // Positions
  positions: Position[];
  setPositions: (positions: Position[]) => void;

  // Selected symbol for detail view
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;

  // Auto-refresh toggle
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

const DEFAULT_AGENTS: Agent[] = [
  { id: "market_analyst", name: "Market Analyst", type: "analyst", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "sentiment_analyst", name: "Sentiment Analyst", type: "analyst", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "news_analyst", name: "News Analyst", type: "analyst", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "fundamentals_analyst", name: "Fundamentals Analyst", type: "analyst", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "onchain_analyst", name: "On-Chain Analyst", type: "analyst", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "bull_researcher", name: "Bull Researcher", type: "researcher", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "bear_researcher", name: "Bear Researcher", type: "researcher", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "risk_manager", name: "Risk Manager", type: "risk", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "portfolio_manager", name: "Portfolio Manager", type: "manager", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
  { id: "trader", name: "Trader Agent", type: "trader", status: "idle", lastAction: null, tradesExecuted: 0, successRate: 0 },
];

const DEFAULT_EXCHANGES: Exchange[] = [
  { id: "binance", name: "Binance", type: "cex", connected: false, status: "online" },
  { id: "bybit", name: "Bybit", type: "cex", connected: false, status: "online" },
  { id: "okx", name: "OKX", type: "cex", connected: false, status: "online" },
  { id: "kraken", name: "Kraken", type: "cex", connected: false, status: "online" },
  { id: "kucoin", name: "KuCoin", type: "cex", connected: false, status: "online" },
  { id: "gate", name: "Gate.io", type: "cex", connected: false, status: "online" },
  { id: "hyperliquid", name: "Hyperliquid", type: "cex", connected: false, status: "online" },
  { id: "jupiter", name: "Jupiter", type: "dex", connected: false, status: "online" },
  { id: "uniswap", name: "Uniswap", type: "dex", connected: false, status: "online" },
];

export const useTradingStore = create<TradingStore>((set) => ({
  simulationMode: false,
  toggleSimulationMode: () =>
    set((state) => ({ simulationMode: !state.simulationMode })),

  agents: DEFAULT_AGENTS,
  setAgents: (agents) => set({ agents }),

  exchanges: DEFAULT_EXCHANGES,
  setExchanges: (exchanges) => set({ exchanges }),

  dailyTarget: null,
  setDailyTarget: (dailyTarget) => set({ dailyTarget }),

  positions: [],
  setPositions: (positions) => set({ positions }),

  selectedSymbol: null,
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),

  autoRefresh: true,
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
}));
