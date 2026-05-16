"use client";

import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTradingStore } from "@/hooks/use-trading-store";

function getClassificationColor(classification: string): string {
  const lower = classification.toLowerCase();
  if (lower.includes("extreme greed") || lower.includes("greed")) return "text-emerald-400";
  if (lower.includes("extreme fear") || lower.includes("fear")) return "text-red-400";
  return "text-amber-400";
}

function getClassificationBg(classification: string): string {
  const lower = classification.toLowerCase();
  if (lower.includes("extreme greed")) return "from-emerald-500/20 to-emerald-500/5";
  if (lower.includes("greed")) return "from-emerald-500/10 to-emerald-500/5";
  if (lower.includes("extreme fear")) return "from-red-500/20 to-red-500/5";
  if (lower.includes("fear")) return "from-red-500/10 to-red-500/5";
  return "from-amber-500/10 to-amber-500/5";
}

export function FearGreedCard() {
  const { fearGreed } = useTradingStore();

  if (!fearGreed) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-400" />
            Fear & Greed Index
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground text-center py-4">
            Loading market sentiment data...
          </p>
        </CardContent>
      </Card>
    );
  }

  const value = fearGreed.value;
  const classification = fearGreed.classification;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-cyan-400" />
          Fear & Greed Index
          <span className="text-[10px] text-muted-foreground ml-auto">
            {fearGreed.date}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={`rounded-lg bg-gradient-to-r ${getClassificationBg(classification)} p-3`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${getClassificationColor(classification)}`}>
                {value}
              </p>
              <p className={`text-xs font-medium ${getClassificationColor(classification)}`}>
                {classification}
              </p>
            </div>
            <div>
              {value >= 60 ? (
                <TrendingUp className="h-8 w-8 text-emerald-400/50" />
              ) : value <= 40 ? (
                <TrendingDown className="h-8 w-8 text-red-400/50" />
              ) : (
                <Minus className="h-8 w-8 text-amber-400/50" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>0 = Extreme Fear</span>
          <span>100 = Extreme Greed</span>
        </div>
      </CardContent>
    </Card>
  );
}
