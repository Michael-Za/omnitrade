"use client";

import { Flame, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/hooks/use-trading-store";

export function TrendingTokens() {
  const { trendingTokens } = useTradingStore();

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          Trending Tokens
          <Badge variant="outline" className="text-[10px] ml-auto">
            DexScreener
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
          {trendingTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading trending tokens...
            </p>
          ) : (
            trendingTokens.slice(0, 8).map((token: any) => (
              <div
                key={token.id}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
              >
                {token.icon ? (
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="h-5 w-5 rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                    {token.symbol?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {token.symbol}
                    <span className="text-muted-foreground font-normal ml-1">
                      {token.name}
                    </span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0 border-violet-500/30 text-violet-400"
                >
                  {token.chainId}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
