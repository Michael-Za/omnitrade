"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketData } from "@/types/trading";

interface MarketPricesTableProps {
  marketData: MarketData | undefined;
  isLoading: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `$${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export function MarketPricesTable({ marketData, isLoading }: MarketPricesTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tickers = marketData?.tickers ?? [];

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Live Market Prices
          <span className="text-[10px] text-muted-foreground ml-auto">
            {tickers.length > 0
              ? `Updated ${new Date(marketData?.lastUpdated ?? 0).toLocaleTimeString()}`
              : "No data"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] h-8">Pair</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Price</TableHead>
                <TableHead className="text-[11px] h-8 text-right">24h Change</TableHead>
                <TableHead className="text-[11px] h-8 text-right hidden sm:table-cell">24h High</TableHead>
                <TableHead className="text-[11px] h-8 text-right hidden sm:table-cell">24h Low</TableHead>
                <TableHead className="text-[11px] h-8 text-right hidden md:table-cell">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground h-20">
                    Market data unavailable — check connection
                  </TableCell>
                </TableRow>
              ) : (
                tickers.map((ticker) => (
                  <TableRow key={ticker.symbol}>
                    <TableCell className="text-xs font-medium">
                      {ticker.symbol}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      ${formatPrice(ticker.price)}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          ticker.changePercent24h >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {ticker.changePercent24h >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(ticker.changePercent24h).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground hidden sm:table-cell">
                      ${formatPrice(ticker.high24h)}
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground hidden sm:table-cell">
                      ${formatPrice(ticker.low24h)}
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground hidden md:table-cell">
                      {formatVolume(ticker.quoteVolume24h)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
