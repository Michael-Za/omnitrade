import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/backend";

export async function GET() {
  try {
    // Try Python backend first (returns real daily target from trading engine)
    const backendTarget = await fetchFromBackend<any>("/api/v1/daily-target");
    if (backendTarget && backendTarget.date) {
      return NextResponse.json({
        ...backendTarget,
        source: "backend",
        timestamp: Date.now(),
      });
    }

    // No backend — no daily target data (requires real trading)
    const today = new Date().toISOString().split("T")[0];
    return NextResponse.json({
      date: today,
      status: "active",
      startingBalance: 0,
      currentBalance: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalPnl: 0,
      totalPnlPct: 0,
      targetProfitPct: 2.0,
      targetProfitAmount: 0,
      maxLossPct: 3.0,
      maxLossAmount: 0,
      targetProgressPct: 0,
      lossProgressPct: 0,
      tradesOpened: 0,
      tradesClosed: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      positionAdjustmentFactor: 1.0,
      source: "no_exchange",
      timestamp: Date.now(),
      note: "Connect an exchange and start the trading bot to track daily targets with real P&L data.",
    });
  } catch (error) {
    console.error("Daily target API error:", error);
    return NextResponse.json(
      {
        date: new Date().toISOString().split("T")[0],
        status: "active",
        source: "error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Try Python backend first
    const result = await fetchFromBackend<any>("/api/v1/daily-target", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (result) {
      return NextResponse.json({
        ...result,
        source: "backend",
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { error: "Backend not available - start the Python backend to update daily target settings" },
      { status: 503 }
    );
  } catch (error) {
    console.error("Daily target PUT error:", error);
    return NextResponse.json({ error: "Failed to update daily target" }, { status: 500 });
  }
}
