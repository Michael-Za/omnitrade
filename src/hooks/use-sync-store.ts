"use client";

import { useEffect, useRef } from "react";
import { useTradingStore } from "./use-trading-store";
import {
  useMarketData,
  useSignals,
  useSystemStatus,
  useBalance,
  useTrades,
  useAgents,
  useDailyTarget,
  useExchanges,
  useNews,
  useFearGreed,
  useTrending,
} from "./use-market-data";

/**
 * Syncs all real-time API data into the Zustand store.
 * Call this once in the root layout or page component.
 * All dashboard components then read from the store.
 */
export function useSyncStoreFromAPIs() {
  const {
    setAgents,
    setExchanges,
    setDailyTarget,
    setPositions,
    setBalance,
    setNews,
    setFearGreed,
    setTrendingTokens,
    setBackendConnected,
    setDataSource,
  } = useTradingStore();

  // Fetch all data using React Query hooks
  const balance = useBalance();
  const trades = useTrades();
  const agents = useAgents();
  const dailyTarget = useDailyTarget();
  const exchanges = useExchanges();
  const news = useNews();
  const fearGreed = useFearGreed();
  const trending = useTrending();
  const status = useSystemStatus();

  // Track previous values to avoid infinite loops
  const prevAgentsRef = useRef<string>("");
  const prevExchangesRef = useRef<string>("");
  const prevTradesRef = useRef<string>("");

  // Sync agents
  useEffect(() => {
    if (agents.data?.agents) {
      const serialized = JSON.stringify(agents.data.agents);
      if (serialized !== prevAgentsRef.current) {
        prevAgentsRef.current = serialized;
        setAgents(agents.data.agents);
        setDataSource(agents.data.source || "unknown");
      }
    }
  }, [agents.data, setAgents, setDataSource]);

  // Sync exchanges
  useEffect(() => {
    if (exchanges.data?.exchanges) {
      const serialized = JSON.stringify(exchanges.data.exchanges);
      if (serialized !== prevExchangesRef.current) {
        prevExchangesRef.current = serialized;
        setExchanges(exchanges.data.exchanges);
      }
    }
  }, [exchanges.data, setExchanges]);

  // Sync daily target
  useEffect(() => {
    if (dailyTarget.data) {
      setDailyTarget(dailyTarget.data);
    }
  }, [dailyTarget.data, setDailyTarget]);

  // Sync trades/positions
  useEffect(() => {
    if (trades.data?.trades) {
      const serialized = JSON.stringify(trades.data.trades);
      if (serialized !== prevTradesRef.current) {
        prevTradesRef.current = serialized;
        // Transform trades to Position format
        const positions = trades.data.trades.map((t: any) => ({
          id: t.id || t.trade_id || String(Math.random()),
          symbol: t.symbol,
          side: (t.side === "long" || t.side === "buy" ? "long" : "short") as "long" | "short",
          status: "open" as const,
          entryPrice: t.entry_price || t.entryPrice || null,
          currentPrice: t.current_price || t.currentPrice || null,
          pnl: t.pnl || null,
          pnlPercent: t.pnl_pct || t.pnlPercent || null,
          stopLoss: t.stop_loss || t.stopLoss || null,
          takeProfit: t.take_profit || t.takeProfit || null,
          size: t.stake_amount || t.size || null,
          exchange: t.exchange || t.enter_tag || null,
          createdAt: t.entry_date || new Date().toISOString(),
        }));
        setPositions(positions);
      }
    }
  }, [trades.data, setPositions]);

  // Sync balance
  useEffect(() => {
    if (balance.data) {
      setBalance(balance.data);
    }
  }, [balance.data, setBalance]);

  // Sync news
  useEffect(() => {
    if (news.data?.articles) {
      setNews(news.data.articles);
    }
  }, [news.data, setNews]);

  // Sync fear & greed
  useEffect(() => {
    if (fearGreed.data?.current) {
      setFearGreed(fearGreed.data.current);
    }
  }, [fearGreed.data, setFearGreed]);

  // Sync trending tokens
  useEffect(() => {
    if (trending.data?.tokens) {
      setTrendingTokens(trending.data.tokens);
    }
  }, [trending.data, setTrendingTokens]);

  // Sync backend status
  useEffect(() => {
    if (status.data) {
      setBackendConnected(status.data.backendConnected ?? false);
    }
  }, [status.data, setBackendConnected]);

  return {
    isLoading:
      balance.isLoading ||
      trades.isLoading ||
      agents.isLoading ||
      exchanges.isLoading,
    hasError:
      balance.isError ||
      agents.isError,
  };
}
