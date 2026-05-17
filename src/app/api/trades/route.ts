import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/backend";

export async function GET() {
  try {
    // Try Python backend first (returns real open trades from exchange)
    const backendTrades = await fetchFromBackend<any>("/api/v1/trades");
    if (backendTrades && backendTrades.trades) {
      return NextResponse.json({
        trades: backendTrades.trades,
        count: backendTrades.count || backendTrades.trades.length,
        source: "exchange",
        timestamp: Date.now(),
      });
    }

    // No exchange configured — no real trades to show
    return NextResponse.json({
      trades: [],
      count: 0,
      source: "no_exchange",
      timestamp: Date.now(),
      note: "Connect an exchange via API keys to see your open positions. No simulated trades are shown.",
    });
  } catch (error) {
    console.error("Trades API error:", error);
    return NextResponse.json(
      {
        trades: [],
        count: 0,
        source: "error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
