"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { AgentPanel } from "@/components/dashboard/agent-panel";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { SignalsTable } from "@/components/dashboard/signals-table";
import { DailyTargetCard } from "@/components/dashboard/daily-target";
import { ExchangesStatus } from "@/components/dashboard/exchanges-status";
import { MarketPricesTable } from "@/components/dashboard/market-prices";
import { NewsPanel } from "@/components/dashboard/news-panel";
import { FearGreedCard } from "@/components/dashboard/fear-greed-card";
import { TrendingTokens } from "@/components/dashboard/trending-tokens";
import { useMarketData, useSignals, useSystemStatus } from "@/hooks/use-market-data";
import { useSyncStoreFromAPIs } from "@/hooks/use-sync-store";
import { useTradingStore } from "@/hooks/use-trading-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Dashboard() {
  const {
    data: marketData,
    isLoading: isMarketLoading,
    error: marketError,
  } = useMarketData();
  const {
    data: signalsData,
    isLoading: isSignalsLoading,
    error: signalsError,
  } = useSignals();
  const {
    data: status,
    isLoading: isStatusLoading,
  } = useSystemStatus();

  // Sync all API data into Zustand store
  const { isLoading: isStoreLoading, hasError: storeError } = useSyncStoreFromAPIs();

  const { simulationMode, backendConnected, dataSource } = useTradingStore();
  const signals = signalsData?.signals;
  const hasError = marketError || signalsError || storeError;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Grid background pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <Header status={status} isStatusLoading={isStatusLoading} />

      {/* Main content */}
      <main className="flex-1 relative z-10">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
          {/* Data Source Banner */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {backendConnected ? (
                <Server className="h-3 w-3 text-emerald-400" />
              ) : (
                <Server className="h-3 w-3 text-amber-400" />
              )}
              <span>
                {backendConnected
                  ? "Python Backend Connected"
                  : "Direct API Mode (Live Data)"}
              </span>
            </div>
            <span className="text-muted-foreground/50">|</span>
            <span>Source: {dataSource === "loading" ? "Loading..." : dataSource}</span>
          </div>

          {/* Error banner */}
          {hasError && (
            <Alert className="border-red-500/30 bg-red-500/5">
              <WifiOff className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400 text-xs">
                Some data sources are unavailable. Market data and signals may be delayed.
              </AlertDescription>
            </Alert>
          )}

          {/* Metric Cards Row */}
          <MetricCards
            marketData={marketData}
            signals={signals}
            isMarketLoading={isMarketLoading}
            isSignalsLoading={isSignalsLoading}
          />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Left Column - Market Data + Signals */}
            <div className="lg:col-span-8 space-y-4 md:space-y-6">
              {/* Market Prices */}
              <MarketPricesTable
                marketData={marketData}
                isLoading={isMarketLoading}
              />

              {/* Signals Table */}
              <SignalsTable signals={signals} isLoading={isSignalsLoading} />

              {/* Positions Table */}
              <PositionsTable marketData={marketData} />

              {/* News & Sentiment Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NewsPanel />
                <div className="space-y-4">
                  <FearGreedCard />
                  <TrendingTokens />
                </div>
              </div>
            </div>

            {/* Right Column - Agents + Daily Target + Exchanges */}
            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              {/* Daily Target */}
              <DailyTargetCard />

              {/* Agent Panel */}
              <AgentPanel />

              {/* Exchanges Status */}
              <ExchangesStatus />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            OmniTrade v1.0.0 · AI-Powered Trading Platform
          </p>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-[9px] ${
                backendConnected
                  ? "border-emerald-500/50 text-emerald-400"
                  : "border-amber-500/50 text-amber-400"
              }`}
            >
              {backendConnected ? "Backend Live" : "Direct API"}
            </Badge>
            <p className="text-[10px] text-muted-foreground">
              {simulationMode ? "⚠️ Simulation Mode — No real trades" : backendConnected ? "Live Trading" : "Market Data Only"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
