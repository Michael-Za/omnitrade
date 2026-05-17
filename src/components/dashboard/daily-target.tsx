"use client";

import { Target, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTradingStore } from "@/hooks/use-trading-store";

export function DailyTargetCard() {
  const { dailyTarget, simulationMode } = useTradingStore();

  // Default daily target when no exchange is connected
  const target = dailyTarget ?? {
    date: new Date().toISOString().split("T")[0],
    status: "active" as const,
    startingBalance: 0,
    currentBalance: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    totalPnl: 0,
    totalPnlPct: 0,
    targetProfitPct: 2.0,
    targetProfitAmount: 0,
    maxLossPct: 3.0,
    maxLossAmount: 0,
    targetProgressPct: 0,
    lossProgressPct: 0,
    tradesOpened: 0,
    tradesClosed: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    positionAdjustmentFactor: 1.0,
  };

  const statusColor = (() => {
    switch (target.status) {
      case "target_reached":
        return "text-emerald-400";
      case "loss_limit_hit":
        return "text-red-400";
      case "target_approaching":
        return "text-cyan-400";
      case "loss_warning":
        return "text-amber-400";
      default:
        return "text-muted-foreground";
    }
  })();

  const statusLabel = (() => {
    switch (target.status) {
      case "target_reached":
        return "Target Hit!";
      case "loss_limit_hit":
        return "Loss Limit Hit";
      case "target_approaching":
        return "Approaching Target";
      case "loss_warning":
        return "Loss Warning";
      case "paused":
        return "Paused";
      default:
        return simulationMode ? "Simulation Active" : "No Exchange";
    }
  })();

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-400" />
          Daily Target
          <span className={`text-xs ml-auto ${statusColor}`}>
            {statusLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* P&L Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Total P&L
            </p>
            <p
              className={`text-lg font-bold ${
                target.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {target.totalPnl >= 0 ? "+" : ""}$
              {Math.abs(target.totalPnl).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {target.totalPnlPct >= 0 ? "+" : ""}
              {target.totalPnlPct.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Balance
            </p>
            <p className="text-lg font-bold text-foreground">
              ${target.currentBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Started: ${target.startingBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Target Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Target: +{target.targetProfitPct}%
            </span>
            <span className="text-muted-foreground">
              {target.targetProgressPct.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, target.targetProgressPct)}
            className="h-1.5 bg-emerald-500/10 [&>[data-slot=progress-indicator]]:bg-emerald-500"
          />
        </div>

        {/* Loss Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-400" />
              Max Loss: -{target.maxLossPct}%
            </span>
            <span className="text-muted-foreground">
              {target.lossProgressPct.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, target.lossProgressPct)}
            className="h-1.5 bg-red-500/10 [&>[data-slot=progress-indicator]]:bg-red-500"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/30">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Trades</p>
            <p className="text-xs font-medium">{target.tradesClosed}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className="text-xs font-medium">{target.winRate.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Risk Adj.</p>
            <p className="text-xs font-medium flex items-center justify-center gap-0.5">
              <Shield className="h-3 w-3 text-muted-foreground" />
              {(target.positionAdjustmentFactor * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
