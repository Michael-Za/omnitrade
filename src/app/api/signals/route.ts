import { NextResponse } from "next/server";

interface Kline {
  0: number;   // Open time
  1: string;   // Open
  2: string;   // High
  3: string;   // Low
  4: string;   // Close
  5: string;   // Volume
}

interface SignalOutput {
  id: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  source: string;
  agent: string;
  price: number | null;
  timestamp: number;
  reasoning: string;
}

// Simple RSI calculation
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Simple Moving Average
function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Exponential Moving Average
function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }
  return ema;
}

function generateSignalFromAnalysis(
  symbol: string,
  closes: number[],
  currentPrice: number
): SignalOutput {
  const rsi = calculateRSI(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, Math.min(50, closes.length));
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  let action: "buy" | "sell" | "hold" = "hold";
  let confidence = 0.5;
  const reasons: string[] = [];

  // RSI analysis
  if (rsi < 30) {
    action = "buy";
    confidence += 0.15;
    reasons.push(`RSI oversold at ${rsi.toFixed(1)}`);
  } else if (rsi > 70) {
    action = "sell";
    confidence += 0.15;
    reasons.push(`RSI overbought at ${rsi.toFixed(1)}`);
  } else if (rsi < 45) {
    if (action !== "sell") action = "buy";
    confidence += 0.05;
    reasons.push(`RSI neutral-bullish at ${rsi.toFixed(1)}`);
  } else if (rsi > 55) {
    if (action !== "buy") action = "sell";
    confidence += 0.05;
    reasons.push(`RSI neutral-bearish at ${rsi.toFixed(1)}`);
  }

  // MA crossover analysis
  if (sma20 > sma50 && ema12 > ema26) {
    if (action === "sell") {
      action = "hold";
      confidence = 0.5;
    } else {
      action = "buy";
      confidence += 0.1;
    }
    reasons.push("Bullish MA crossover");
  } else if (sma20 < sma50 && ema12 < ema26) {
    if (action === "buy") {
      action = "hold";
      confidence = 0.5;
    } else {
      action = "sell";
      confidence += 0.1;
    }
    reasons.push("Bearish MA crossover");
  }

  // Price vs SMA analysis
  if (currentPrice > sma20) {
    if (action === "buy") confidence += 0.05;
    reasons.push("Price above SMA20");
  } else {
    if (action === "sell") confidence += 0.05;
    reasons.push("Price below SMA20");
  }

  // Clamp confidence
  confidence = Math.min(0.95, Math.max(0.15, confidence));

  // Determine agent source
  const agents = ["RSI Analyzer", "MA Crossover", "Trend Scanner", "Momentum Detector"];
  const agent = agents[Math.floor(Math.random() * agents.length)];

  return {
    id: `sig_${symbol}_${Date.now()}`,
    symbol,
    action,
    confidence: Math.round(confidence * 100) / 100,
    source: "technical_analysis",
    agent,
    price: currentPrice,
    timestamp: Date.now(),
    reasoning: reasons.join("; "),
  };
}

export async function GET() {
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];

    const signals: SignalOutput[] = [];

    // Fetch kline data for each symbol to generate real signals
    const fetchPromises = symbols.map(async (symbol) => {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`;
        const response = await fetch(url, {
          next: { revalidate: 60 },
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return null;

        const data: Kline[] = await response.json();
        const closes = data.map((k) => parseFloat(k[4]));
        const currentPrice = closes[closes.length - 1];

        if (closes.length < 20) return null;

        return generateSignalFromAnalysis(
          symbol.replace("USDT", "/USDT"),
          closes,
          currentPrice
        );
      } catch {
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (result) {
        signals.push(result);
      }
    }

    // If no signals could be generated, return empty array
    if (signals.length === 0) {
      return NextResponse.json({
        signals: [],
        lastUpdated: Date.now(),
        source: "technical_analysis",
        note: "No signals generated - market data unavailable",
      });
    }

    return NextResponse.json({
      signals,
      lastUpdated: Date.now(),
      source: "technical_analysis",
    });
  } catch (error) {
    console.error("Signals API error:", error);
    return NextResponse.json(
      {
        signals: [],
        lastUpdated: 0,
        source: "technical_analysis",
        error: "Failed to generate signals",
      },
      { status: 500 }
    );
  }
}
