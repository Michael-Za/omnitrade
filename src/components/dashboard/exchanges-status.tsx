"use client";

import { CheckCircle2, XCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/hooks/use-trading-store";
import type { Exchange } from "@/types/trading";

function ExchangeRow({ exchange }: { exchange: Exchange }) {
  const isConnected = exchange.connected;
  const isOnline = exchange.status === "online";

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
        <span className="text-xs text-foreground">{exchange.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 ${
            exchange.type === "cex"
              ? "border-cyan-500/30 text-cyan-400"
              : exchange.type === "dex"
                ? "border-violet-500/30 text-violet-400"
                : "border-amber-500/30 text-amber-400"
          }`}
        >
          {exchange.type.toUpperCase()}
        </Badge>
        {isConnected ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : isOnline ? (
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>
    </div>
  );
}

export function ExchangesStatus() {
  const { exchanges } = useTradingStore();

  const connectedCount = exchanges.filter((e) => e.connected).length;
  const onlineCount = exchanges.filter((e) => e.status === "online").length;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Exchanges
          <Badge variant="outline" className="text-[10px] ml-auto">
            {connectedCount}/{exchanges.length} connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5">
          {exchanges.map((exchange) => (
            <ExchangeRow key={exchange.id} exchange={exchange} />
          ))}
        </div>
        {connectedCount === 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              No exchanges connected
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Configure API keys to connect your exchange accounts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
