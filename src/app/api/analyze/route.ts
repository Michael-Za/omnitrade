import { NextResponse } from "next/server";
import { fetchFromBackend, fetchBinanceKlines, generateSignalFromAnalysis } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, analysts, language } = body;

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker symbol is required" },
        { status: 400 }
      );
    }

    // Try Python backend first (full LangGraph agent pipeline)
    const backendResult = await fetchFromBackend<any>("/api/v1/analyze", {
      method: "POST",
      body: JSON.stringify({ ticker, analysts, language }),
    });

    if (backendResult && backendResult.status !== "analysis_started") {
      return NextResponse.json({
        ...backendResult,
        source: "backend",
        timestamp: Date.now(),
      });
    }

    // No backend — run real-time technical analysis directly using Binance data
    const symbol = ticker.toUpperCase().replace("/", "").replace("USDT", "") + "USDT";
    const signals: Array<{
      id: string;
      symbol: string;
      action: "buy" | "sell" | "hold";
      confidence: number;
      source: string;
      agent: string;
      price: number;
      timestamp: number;
      reasoning: string;
    }> = [];

    try {
      const klines = await fetchBinanceKlines(symbol, "1h", 100);
      if (klines.length > 20) {
        const closes = klines.map((k) => parseFloat(k[4]));
        const currentPrice = closes[closes.length - 1];

        const signal = generateSignalFromAnalysis(
          ticker.toUpperCase().replace("USDT", "/USDT"),
          closes,
          currentPrice
        );

        signals.push(signal);
      }
    } catch (err) {
      console.error(`Failed to analyze ${symbol}:`, err);
    }

    // Also try different timeframes
    const timeframes = ["5m", "15m", "4h"];
    for (const tf of timeframes) {
      try {
        const klines = await fetchBinanceKlines(symbol, tf, 100);
        if (klines.length > 20) {
          const closes = klines.map((k) => parseFloat(k[4]));
          const currentPrice = closes[closes.length - 1];

          const signal = generateSignalFromAnalysis(
            `${ticker.toUpperCase().replace("USDT", "/USDT")} (${tf})`,
            closes,
            currentPrice
          );
          signals.push(signal);
        }
      } catch {
        // Skip timeframe if unavailable
      }
    }

    return NextResponse.json({
      status: "analysis_complete",
      ticker: ticker.toUpperCase(),
      signals,
      analystsUsed: analysts || ["technical_analysis"],
      language: language || "en",
      source: "direct_analysis",
      timestamp: Date.now(),
      note: "Full multi-agent analysis requires the Python backend with LLM API keys configured. Current analysis uses real-time Binance data with technical indicators.",
    });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Analysis failed", timestamp: Date.now() },
      { status: 500 }
    );
  }
}
