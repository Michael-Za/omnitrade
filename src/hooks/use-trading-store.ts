"use client";

import { create } from "zustand";
import type { Agent, Exchange, DailyTarget, Position } from "@/types/trading";

interface TradingStore {
  // Simulation mode
  simulationMode: boolean;
  toggleSimulationMode: () => void;

  // Agents — populated from /api/agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Exchanges — populated from /api/exchanges
  exchanges: Exchange[];
  setExchanges: (exchanges: Exchange[]) => void;

  // Daily target — populated from /api/daily-target
  dailyTarget: DailyTarget | null;
  setDailyTarget: (target: DailyTarget | null) => void;

  // Positions — populated from /api/trades
  positions: Position[];
  setPositions: (positions: Position[]) => void;

  // Balance data
  balance: {
    currency: string;
    total: number;
    free: number;
    used: number;
    source?: string;
    note?: string;
    btcPrice?: number;
    changePercent24h?: number;
    totalVolume24h?: number;
  } | null;
  setBalance: (balance: TradingStore["balance"]) => void;

  // News
  news: any[];
  setNews: (news: any[]) => void;

  // Fear & Greed
  fearGreed: { value: number; classification: string; date: string } | null;
  setFearGreed: (data: TradingStore["fearGreed"]) => void;

  // Trending tokens
  trendingTokens: any[];
  setTrendingTokens: (tokens: any[]) => void;

  // Backend connection
  backendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;

  // Data source info
  dataSource: string;
  setDataSource: (source: string) => void;

  // Selected symbol for detail view
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;

  // Auto-refresh toggle
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  simulationMode: false,
  toggleSimulationMode: () =>
    set((state) => ({ simulationMode: !state.simulationMode })),

  // Start with empty arrays — will be populated from real API data
  agents: [],
  setAgents: (agents) => set({ agents }),

  exchanges: [],
  setExchanges: (exchanges) => set({ exchanges }),

  dailyTarget: null,
  setDailyTarget: (dailyTarget) => set({ dailyTarget }),

  positions: [],
  setPositions: (positions) => set({ positions }),

  balance: null,
  setBalance: (balance) => set({ balance }),

  news: [],
  setNews: (news) => set({ news }),

  fearGreed: null,
  setFearGreed: (fearGreed) => set({ fearGreed }),

  trendingTokens: [],
  setTrendingTokens: (trendingTokens) => set({ trendingTokens }),

  backendConnected: false,
  setBackendConnected: (backendConnected) => set({ backendConnected }),

  dataSource: "loading",
  setDataSource: (dataSource) => set({ dataSource }),

  selectedSymbol: null,
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),

  autoRefresh: true,
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
}));
