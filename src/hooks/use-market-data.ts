"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketData, TradingSignal, SystemStatus } from "@/types/trading";

export function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["market-data"],
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useSignals() {
  return useQuery<{ signals: TradingSignal[]; lastUpdated: number }>({
    queryKey: ["signals"],
    queryFn: async () => {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error("Failed to fetch signals");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useSystemStatus() {
  return useQuery<SystemStatus>({
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
