import { NextResponse } from "next/server";
import { fetchFromBackend, fetchBinanceKlines, generateSignalFromAnalysis } from "@/lib/backend";

const AGENT_DEFINITIONS = [
  {
    id: "market_analyst",
    name: "Market Analyst",
    type: "analyst",
    description: "Analyzes price action, trends, and technical indicators",
  },
  {
    id: "sentiment_analyst",
    name: "Sentiment Analyst",
    type: "analyst",
    description: "Monitors social media and market sentiment",
  },
  {
    id: "news_analyst",
    name: "News Analyst",
    type: "analyst",
    description: "Tracks breaking crypto news and announcements",
  },
  {
    id: "fundamentals_analyst",
    name: "Fundamentals Analyst",
    type: "analyst",
    description: "Evaluates on-chain metrics and project fundamentals",
  },
  {
    id: "onchain_analyst",
    name: "On-Chain Analyst",
    type: "analyst",
    description: "Monitors whale movements and smart money flows",
  },
  {
    id: "memecoin_analyst",
    name: "Memecoin Analyst",
    type: "analyst",
    description: "Tracks trending memecoins and DEX activity",
  },
  {
    id: "twitter_analyst",
    name: "Twitter/X Analyst",
    type: "analyst",
    description: "Monitors Twitter/X for crypto trending topics",
  },
  {
    id: "bull_researcher",
    name: "Bull Researcher",
    type: "researcher",
    description: "Synthesizes bullish arguments from analyst reports",
  },
  {
    id: "bear_researcher",
    name: "Bear Researcher",
    type: "researcher",
    description: "Synthesizes bearish arguments from analyst reports",
  },
  {
    id: "research_manager",
    name: "Research Manager",
    type: "manager",
    description: "Judges the bull/bear debate and forms consensus",
  },
  {
    id: "trader",
    name: "Trader Agent",
    type: "trader",
    description: "Creates trade proposals with risk sizing",
  },
  {
    id: "aggressive_debator",
    name: "Aggressive Debator",
    type: "risk",
    description: "Argues for larger position sizes",
  },
  {
    id: "conservative_debator",
    name: "Conservative Debator",
    type: "risk",
    description: "Argues for smaller position sizes",
  },
  {
    id: "neutral_debator",
    name: "Neutral Debator",
    type: "risk",
    description: "Provides balanced risk assessment",
  },
  {
    id: "portfolio_manager",
    name: "Portfolio Manager",
    type: "manager",
    description: "Makes final allocation decisions with daily target awareness",
  },
];

export async function GET() {
  try {
    // Try Python backend first (returns real agent status if engine is running)
    const backendAgents = await fetchFromBackend<any>("/api/v1/agents/status");
    if (backendAgents && backendAgents.agents && backendAgents.agents.length > 0) {
      // Merge backend agent status with our definitions for full metadata
      const merged = AGENT_DEFINITIONS.map((def) => {
        const backendAgent = backendAgents.agents.find(
          (a: any) => a.name === def.id || a.name === def.name
        );
        return {
          ...def,
          status: backendAgent?.status || "idle",
          lastAction: backendAgent?.lastAction || null,
          tradesExecuted: backendAgent?.tradesExecuted || 0,
          successRate: backendAgent?.successRate || 0,
        };
      });

      return NextResponse.json({
        agents: merged,
        source: "backend",
        timestamp: Date.now(),
      });
    }

    // No backend running — try to determine which agents have real data available
    // by checking if we can fetch market data
    const agentStatuses = await Promise.all(
      AGENT_DEFINITIONS.map(async (def) => {
        let status: "active" | "idle" | "error" | "analyzing" = "idle";
        let lastAction: string | null = null;
        let tradesExecuted = 0;
        let successRate = 0;

        // Check if we have real data for this agent type
        try {
          if (def.id === "market_analyst") {
            // Can we fetch real kline data?
            const klines = await fetchBinanceKlines("BTCUSDT", "1h", 2);
            if (klines.length > 0) {
              status = "active";
              lastAction = `Analyzing BTC/USDT - Price: $${parseFloat(klines[klines.length - 1][4]).toFixed(2)}`;
              tradesExecuted = 0;
              successRate = 0;
            }
          } else if (def.id === "sentiment_analyst") {
            // Fear & Greed index available via alternative.me
            status = "active";
            lastAction = "Monitoring market sentiment via Fear & Greed Index";
          } else if (def.id === "news_analyst") {
            // CryptoCompare news is freely available
            status = "active";
            lastAction = "Tracking latest crypto news via CryptoCompare";
          } else if (def.id === "onchain_analyst") {
            status = "idle";
            lastAction = "Requires on-chain API (not configured)";
          } else if (def.id === "memecoin_analyst") {
            // DexScreener trending is free
            status = "active";
            lastAction = "Tracking trending tokens via DexScreener";
          } else if (def.id === "twitter_analyst") {
            status = "idle";
            lastAction = "Requires Twitter/X API key";
          } else if (def.id === "fundamentals_analyst") {
            // yfinance provides fundamental data in Python backend
            status = "idle";
            lastAction = "Available when Python backend is running";
          } else if (def.type === "researcher" || def.type === "manager" || def.type === "risk") {
            // These agents need the LangGraph pipeline running
            status = "idle";
            lastAction = "Requires Python backend with LLM API key";
          } else if (def.id === "trader") {
            status = "idle";
            lastAction = "Requires exchange API keys";
          }
        } catch {
          status = "error";
          lastAction = "Data source unavailable";
        }

        return {
          ...def,
          status,
          lastAction,
          tradesExecuted,
          successRate,
        };
      })
    );

    return NextResponse.json({
      agents: agentStatuses,
      source: "real_data_check",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Agents API error:", error);
    return NextResponse.json(
      {
        agents: AGENT_DEFINITIONS.map((def) => ({
          ...def,
          status: "error" as const,
          lastAction: "Error checking status",
          tradesExecuted: 0,
          successRate: 0,
        })),
        source: "error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
