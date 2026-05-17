import { NextResponse } from "next/server";
import { fetchFromBackend, fetchBinanceTickers, fetchCoinGeckoMarkets } from "@/lib/backend";

export async function GET() {
  try {
    // Try Python backend first (returns real exchange balance if configured)
    const backendBalance = await fetchFromBackend<any>("/api/v1/balance");
    if (backendBalance && backendBalance.currency) {
      return NextResponse.json({
        ...backendBalance,
        timestamp: Date.now(),
        source: "exchange",
      });
    }

    // No exchange configured — calculate estimated portfolio from real market data
    // This shows what the market looks like without requiring exchange API keys
    let totalMarketCap = 0;
    let totalVolume24h = 0;
    let btcPrice = 0;
    let btcChange24h = 0;

    try {
      const tickers = await fetchBinanceTickers();
      const btcTicker = tickers.find((t) => t.symbol === "BTCUSDT");
      btcPrice = btcTicker ? parseFloat(btcTicker.lastPrice) : 0;
      btcChange24h = btcTicker ? parseFloat(btcTicker.priceChangePercent) : 0;
      totalVolume24h = tickers.reduce(
        (sum, t) => sum + parseFloat(t.quoteVolume),
        0
      );
    } catch {
      try {
        const coins = await fetchCoinGeckoMarkets();
        const btc = coins.find((c) => c.id === "bitcoin");
        btcPrice = btc?.current_price || 0;
        btcChange24h = btc?.price_change_percentage_24h || 0;
        totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
        totalVolume24h = coins.reduce(
          (sum, c) => sum + (c.total_volume || 0),
          0
        );
      } catch {
        // Both APIs failed
      }
    }

    return NextResponse.json({
      currency: "USDT",
      total: 0, // No exchange connected = no real balance
      free: 0,
      used: 0,
      change24h: 0,
      changePercent24h: btcChange24h,
      btcPrice,
      totalMarketCap,
      totalVolume24h,
      source: "market_data_only",
      timestamp: Date.now(),
      note: "Connect an exchange via API keys to see your real balance. Market data is live.",
    });
  } catch (error) {
    console.error("Balance API error:", error);
    return NextResponse.json(
      {
        currency: "USDT",
        total: 0,
        free: 0,
        used: 0,
        source: "error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
