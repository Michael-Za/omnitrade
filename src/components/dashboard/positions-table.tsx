"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
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
import { useTradingStore } from "@/hooks/use-trading-store";
import type { MarketData } from "@/types/trading";

interface PositionsTableProps {
  marketData: MarketData | undefined;
}

export function PositionsTable({ marketData }: PositionsTableProps) {
  const { positions, simulationMode } = useTradingStore();

  // Show empty state if no exchange connected and not in simulation mode
  if (!simulationMode && positions.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Minus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No open positions</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Connect an exchange or enable simulation mode to see positions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Open Positions
          {simulationMode && (
            <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[9px]">
              SIM
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] h-8">Symbol</TableHead>
                <TableHead className="text-[11px] h-8">Side</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Entry</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Current</TableHead>
                <TableHead className="text-[11px] h-8 text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground h-20">
                    No positions open
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((pos) => {
                  const pnl = pos.pnl ?? 0;
                  const pnlPct = pos.pnlPercent ?? 0;
                  return (
                    <TableRow key={pos.id}>
                      <TableCell className="text-xs font-medium">
                        {pos.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            pos.side === "long"
                              ? "border-emerald-500/50 text-emerald-400 text-[10px]"
                              : "border-red-500/50 text-red-400 text-[10px]"
                          }
                        >
                          {pos.side === "long" ? (
                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          )}
                          {pos.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {pos.entryPrice?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {pos.currentPrice?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell
                        className={`text-xs text-right font-medium ${
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}
                        {pnlPct.toFixed(2)}%)
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
