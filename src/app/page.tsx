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
import { useMarketData, useSignals, useSystemStatus } from "@/hooks/use-market-data";
import { useTradingStore } from "@/hooks/use-trading-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

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
  const { simulationMode } = useTradingStore();

  const signals = signalsData?.signals;
  const hasError = marketError || signalsError;

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
          <p className="text-[10px] text-muted-foreground">
            {simulationMode ? "⚠️ Simulation Mode — No real trades" : "No exchange connected"}
          </p>
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
