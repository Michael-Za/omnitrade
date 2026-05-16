"use client";

import { ArrowUpRight, ArrowDownRight, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TradingSignal } from "@/types/trading";

interface SignalsTableProps {
  signals: TradingSignal[] | undefined;
  isLoading: boolean;
}

function getActionIcon(action: TradingSignal["action"]) {
  switch (action) {
    case "buy":
      return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />;
    case "sell":
      return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
    case "hold":
      return <MinusCircle className="h-3.5 w-3.5 text-amber-400" />;
  }
}

function getActionBadge(action: TradingSignal["action"]) {
  switch (action) {
    case "buy":
      return "border-emerald-500/50 text-emerald-400";
    case "sell":
      return "border-red-500/50 text-red-400";
    case "hold":
      return "border-amber-500/50 text-amber-400";
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return "text-emerald-400";
  if (confidence >= 0.5) return "text-amber-400";
  return "text-red-400";
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SignalsTable({ signals, isLoading }: SignalsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedSignals = [...(signals ?? [])].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Trading Signals
          <Badge variant="outline" className="text-[10px] ml-auto">
            {signals?.length ?? 0} signals
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] h-8">Signal</TableHead>
                <TableHead className="text-[11px] h-8">Symbol</TableHead>
                <TableHead className="text-[11px] h-8">Agent</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Conf.</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Price</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSignals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-xs text-muted-foreground h-20"
                  >
                    No signals generated yet
                  </TableCell>
                </TableRow>
              ) : (
                sortedSignals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 ${getActionBadge(signal.action)}`}
                      >
                        {getActionIcon(signal.action)}
                        <span className="ml-0.5 uppercase">
                          {signal.action}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {signal.symbol}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {signal.agent}
                    </TableCell>
                    <TableCell
                      className={`text-xs text-right font-medium ${getConfidenceColor(signal.confidence)}`}
                    >
                      {(signal.confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {signal.price
                        ? `$${signal.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {timeAgo(signal.timestamp)}
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
