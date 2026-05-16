"use client";

import { Activity, Radio, Wifi, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/hooks/use-trading-store";
import type { SystemStatus } from "@/types/trading";

interface HeaderProps {
  status: SystemStatus | undefined;
  isStatusLoading: boolean;
}

export function Header({ status, isStatusLoading }: HeaderProps) {
  const { simulationMode, toggleSimulationMode, autoRefresh, setAutoRefresh } =
    useTradingStore();

  const isConnected = status?.exchangeConnected ?? false;
  const systemState = status?.state ?? "stopped";

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-7 w-7 text-cyan-400" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              OmniTrade
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              AI Trading Platform
            </p>
          </div>
        </div>

        {/* Center status */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Exchange Connected" : "No Exchange"}
            </span>
          </div>

          <Badge
            variant="outline"
            className={
              systemState === "running"
                ? "border-emerald-500/50 text-emerald-400"
                : systemState === "paused"
                  ? "border-amber-500/50 text-amber-400"
                  : systemState === "error"
                    ? "border-red-500/50 text-red-400"
                    : "border-muted-foreground/50 text-muted-foreground"
            }
          >
            <Radio className="h-3 w-3 mr-1" />
            {systemState === "running"
              ? "Running"
              : systemState === "paused"
                ? "Paused"
                : systemState === "error"
                  ? "Error"
                  : "Stopped"}
          </Badge>

          {isStatusLoading && (
            <div className="h-3 w-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Simulation Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Simulation</span>
            <Switch
              checked={simulationMode}
              onCheckedChange={toggleSimulationMode}
              className="data-[state=checked]:bg-cyan-600"
            />
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Auto-refresh
            </span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {simulationMode && (
            <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[10px]">
              SIMULATION
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
