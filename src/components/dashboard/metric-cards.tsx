"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradingStore } from "@/hooks/use-trading-store";
import type { MarketData, TradingSignal } from "@/types/trading";

interface MetricCardsProps {
  marketData: MarketData | undefined;
  signals: TradingSignal[] | undefined;
  isMarketLoading: boolean;
  isSignalsLoading: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(4)}`;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function MetricCards({
  marketData,
  signals,
  isMarketLoading,
  isSignalsLoading,
}: MetricCardsProps) {
  const { simulationMode, positions } = useTradingStore();

  // Calculate total market volume from real data
  const totalVolume =
    marketData?.tickers.reduce((sum, t) => sum + t.quoteVolume24h, 0) ?? 0;

  // Count signals by action
  const buySignals = signals?.filter((s) => s.action === "buy").length ?? 0;
  const sellSignals = signals?.filter((s) => s.action === "sell").length ?? 0;
  const totalSignals = signals?.length ?? 0;

  // Get BTC price for the "portfolio" display
  const btcTicker = marketData?.tickers.find((t) => t.symbol === "BTC/USDT");
  const btcPrice = btcTicker?.price ?? 0;
  const btcChange = btcTicker?.changePercent24h ?? 0;

  // In simulation mode, show a simulated balance based on BTC price
  const simulatedBalance = simulationMode ? 10000 : 0;
  const simulatedPnl = simulationMode
    ? (btcChange / 100) * simulatedBalance
    : 0;

  const metrics = [
    {
      label: "Portfolio Value",
      value: simulationMode
        ? formatCurrency(simulatedBalance)
        : "$0.00",
      subValue: simulationMode
        ? `${simulatedPnl >= 0 ? "+" : ""}${formatCurrency(simulatedPnl)}`
        : "Connect Exchange",
      subValueColor:
        simulationMode && simulatedPnl >= 0
          ? "text-emerald-400"
          : simulationMode && simulatedPnl < 0
            ? "text-red-400"
            : "text-muted-foreground",
      icon: DollarSign,
      iconColor: "text-cyan-400",
      loading: isMarketLoading,
    },
    {
      label: "24h Change",
      value: btcChange >= 0 ? `+${btcChange.toFixed(2)}%` : `${btcChange.toFixed(2)}%`,
      subValue: btcPrice > 0 ? `BTC @ ${formatCurrency(btcPrice)}` : "No data",
      subValueColor: btcChange >= 0 ? "text-emerald-400" : "text-red-400",
      icon: btcChange >= 0 ? TrendingUp : TrendingDown,
      iconColor: btcChange >= 0 ? "text-emerald-400" : "text-red-400",
      loading: isMarketLoading,
    },
    {
      label: "Open Positions",
      value: positions.length.toString(),
      subValue: simulationMode ? "Simulation Mode" : "No positions",
      subValueColor: "text-muted-foreground",
      icon: BarChart3,
      iconColor: "text-violet-400",
      loading: false,
    },
    {
      label: "Active Signals",
      value: totalSignals.toString(),
      subValue: `${buySignals} buy · ${sellSignals} sell`,
      subValueColor: "text-muted-foreground",
      icon: Zap,
      iconColor: "text-amber-400",
      loading: isSignalsLoading,
    },
    {
      label: "Market Volume",
      value: `$${formatCompactNumber(totalVolume)}`,
      subValue: `${marketData?.tickers.length ?? 0} pairs tracked`,
      subValueColor: "text-muted-foreground",
      icon: Target,
      iconColor: "text-rose-400",
      loading: isMarketLoading,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-colors"
        >
          <CardContent className="p-4">
            {metric.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                </div>
                <p className="text-xl font-bold text-foreground tracking-tight">
                  {metric.value}
                </p>
                <p className={`text-xs mt-1 ${metric.subValueColor}`}>
                  {metric.subValue}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
