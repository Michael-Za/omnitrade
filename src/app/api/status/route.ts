import { NextResponse } from "next/server";
import { fetchFromBackend, isBackendRunning, fetchBinanceTickers, fetchCoinGeckoMarkets } from "@/lib/backend";

export async function GET() {
  try {
    // Try Python backend first
    const backendStatus = await fetchFromBackend<any>("/api/v1/status");
    if (backendStatus && backendStatus.state !== "not_initialized") {
      return NextResponse.json({
        ...backendStatus,
        timestamp: Date.now(),
        backendConnected: true,
      });
    }

    // Backend not running — determine system status from real data availability
    let exchangeConnected = false;
    let llmAvailable = false;

    try {
      // Check if Binance API is accessible (indicates market data available)
      const tickers = await fetchBinanceTickers();
      exchangeConnected = tickers.length > 0;
    } catch {
      // Try CoinGecko fallback
      try {
        const coins = await fetchCoinGeckoMarkets();
        exchangeConnected = coins.length > 0;
      } catch {
        exchangeConnected = false;
      }
    }

    const status = {
      state: exchangeConnected ? "running" as const : "stopped" as const,
      uptime: exchangeConnected ? process.uptime() : 0,
      exchangeConnected,
      activePositions: 0,
      totalTrades: 0,
      llmAvailable,
      version: "1.0.0",
      backendConnected: false,
      timestamp: Date.now(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      {
        state: "error",
        uptime: 0,
        exchangeConnected: false,
        activePositions: 0,
        totalTrades: 0,
        llmAvailable: false,
        version: "1.0.0",
        backendConnected: false,
        error: "Failed to get system status",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
