"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Zap,
  Target,
  Gauge,
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
  const { simulationMode, positions, balance, fearGreed } = useTradingStore();

  // Calculate total market volume from real data
  const totalVolume =
    marketData?.tickers.reduce((sum, t) => sum + t.quoteVolume24h, 0) ?? 0;

  // Count signals by action
  const buySignals = signals?.filter((s) => s.action === "buy").length ?? 0;
  const sellSignals = signals?.filter((s) => s.action === "sell").length ?? 0;
  const totalSignals = signals?.length ?? 0;

  // Get BTC price for the "portfolio" display
  const btcTicker = marketData?.tickers.find((t) => t.symbol === "BTC/USDT");
  const btcPrice = btcTicker?.price ?? balance?.btcPrice ?? 0;
  const btcChange = btcTicker?.changePercent24h ?? balance?.changePercent24h ?? 0;

  // Real balance from exchange or market data
  const portfolioValue = balance?.total ?? 0;
  const portfolioChange = balance?.changePercent24h ?? btcChange;
  const portfolioSource = balance?.source ?? "market_data_only";

  const metrics = [
    {
      label: "Portfolio Value",
      value: portfolioValue > 0
        ? formatCurrency(portfolioValue)
        : btcPrice > 0
          ? `BTC @ ${formatCurrency(btcPrice)}`
          : "$0.00",
      subValue: portfolioValue > 0
        ? `${portfolioChange >= 0 ? "+" : ""}${portfolioChange.toFixed(2)}%`
        : portfolioSource === "market_data_only"
          ? "Connect Exchange for Balance"
          : "Loading...",
      subValueColor:
        portfolioChange >= 0 ? "text-emerald-400" : "text-red-400",
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
      subValue: positions.length > 0
        ? `${positions.filter((p) => p.side === "long").length}L / ${positions.filter((p) => p.side === "short").length}S`
        : "No exchange connected",
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

  // Add Fear & Greed as a 6th metric if available
  if (fearGreed) {
    metrics.push({
      label: "Fear & Greed",
      value: `${fearGreed.value}`,
      subValue: fearGreed.classification,
      subValueColor:
        fearGreed.value >= 60
          ? "text-emerald-400"
          : fearGreed.value <= 40
            ? "text-red-400"
            : "text-amber-400",
      icon: Gauge,
      iconColor:
        fearGreed.value >= 60
          ? "text-emerald-400"
          : fearGreed.value <= 40
            ? "text-red-400"
            : "text-amber-400",
      loading: false,
    });
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${metrics.length > 5 ? 6 : 5} gap-3 md:gap-4`}
      style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 6)}, minmax(0, 1fr))` }}
    >
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
