"use client";

import {
  Brain,
  Search,
  Newspaper,
  TrendingUp,
  Shield,
  Scale,
  BarChart3,
  Bot,
  Cpu,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradingStore } from "@/hooks/use-trading-store";
import type { Agent } from "@/types/trading";

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  market_analyst: TrendingUp,
  sentiment_analyst: Search,
  news_analyst: Newspaper,
  fundamentals_analyst: BarChart3,
  onchain_analyst: Globe,
  bull_researcher: TrendingUp,
  bear_researcher: Shield,
  risk_manager: Scale,
  portfolio_manager: Cpu,
  trader: Bot,
};

function getStatusColor(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "bg-emerald-400";
    case "analyzing":
      return "bg-cyan-400 animate-pulse";
    case "error":
      return "bg-red-400";
    case "idle":
    default:
      return "bg-muted-foreground/50";
  }
}

function getStatusBadge(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "border-emerald-500/50 text-emerald-400";
    case "analyzing":
      return "border-cyan-500/50 text-cyan-400";
    case "error":
      return "border-red-500/50 text-red-400";
    case "idle":
    default:
      return "border-muted-foreground/30 text-muted-foreground";
  }
}

export function AgentPanel() {
  const { agents } = useTradingStore();

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-cyan-400" />
          AI Agents
          <Badge variant="outline" className="text-[10px] ml-auto">
            {agents.filter((a) => a.status === "active" || a.status === "analyzing").length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          {agents.map((agent) => {
            const Icon = agentIcons[agent.id] || Bot;
            return (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="relative">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                  <div
                    className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${getStatusColor(agent.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {agent.lastAction ?? "Idle"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 ${getStatusBadge(agent.status)}`}
                >
                  {agent.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentPanelSkeleton() {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
