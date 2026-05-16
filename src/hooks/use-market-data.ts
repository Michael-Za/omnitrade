"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketData, TradingSignal, SystemStatus, Balance, DailyTarget, Agent, Exchange } from "@/types/trading";

// ─── Market Data ─────────────────────────────────────────────────────

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market-data"],
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
    refetchInterval: 15000, // Faster refresh for real-time feel
    staleTime: 10000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

// ─── Signals ─────────────────────────────────────────────────────────

export function useSignals() {
  return useQuery<{ signals: TradingSignal[]; lastUpdated: number }>({
    queryKey: ["signals"],
    queryFn: async () => {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

// ─── System Status ───────────────────────────────────────────────────

export function useSystemStatus() {
  return useQuery<SystemStatus & { backendConnected?: boolean }>({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 2,
  });
}

// ─── Balance ─────────────────────────────────────────────────────────

export function useBalance() {
  return useQuery<Balance & { source?: string; note?: string; btcPrice?: number; changePercent24h?: number; totalVolume24h?: number }>({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await fetch("/api/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });
}

// ─── Trades / Positions ─────────────────────────────────────────────

export function useTrades() {
  return useQuery<{ trades: any[]; count: number; source?: string; note?: string }>({
    queryKey: ["trades"],
    queryFn: async () => {
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
  });
}

// ─── Agents ──────────────────────────────────────────────────────────

export function useAgents() {
  return useQuery<{ agents: Agent[]; source?: string }>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 2,
  });
}

// ─── Daily Target ────────────────────────────────────────────────────

export function useDailyTarget() {
  return useQuery<DailyTarget & { source?: string; note?: string }>({
    queryKey: ["daily-target"],
    queryFn: async () => {
      const res = await fetch("/api/daily-target");
      if (!res.ok) throw new Error("Failed to fetch daily target");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });
}

// ─── Exchanges ───────────────────────────────────────────────────────

export function useExchanges() {
  return useQuery<{ exchanges: Exchange[]; connectedCount: number; source?: string; note?: string }>({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const res = await fetch("/api/exchanges");
      if (!res.ok) throw new Error("Failed to fetch exchanges");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });
}

// ─── News ────────────────────────────────────────────────────────────

interface NewsArticle {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  categories?: string;
  body?: string;
}

export function useNews() {
  return useQuery<{ articles: NewsArticle[]; count: number; source?: string }>({
    queryKey: ["news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 120000, // News doesn't need to be super fresh
    staleTime: 60000,
    retry: 2,
  });
}

// ─── Fear & Greed ────────────────────────────────────────────────────

export function useFearGreed() {
  return useQuery<{
    current: { value: number; classification: string; date: string } | null;
    history: { value: number; classification: string; date: string }[];
    source?: string;
  }>({
    queryKey: ["fear-greed"],
    queryFn: async () => {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) throw new Error("Failed to fetch fear & greed");
      return res.json();
    },
    refetchInterval: 300000, // 5 min
    staleTime: 180000,
    retry: 2,
  });
}

// ─── Trending Tokens ─────────────────────────────────────────────────

export function useTrending() {
  return useQuery<{ tokens: any[]; count: number; source?: string }>({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await fetch("/api/trending");
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 2,
  });
}
