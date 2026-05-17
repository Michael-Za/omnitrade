/**
 * Backend Proxy Utility
 *
 * Connects to the Python FastAPI backend when available,
 * falls back to direct real data sources (Binance, CoinGecko, DexScreener, etc.)
 * NEVER returns mock/hardcoded data.
 */

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8080";
const BACKEND_TIMEOUT = 5000;

/**
 * Try to fetch from the Python FastAPI backend.
 * Returns null if backend is unavailable.
 */
export async function fetchFromBackend<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Check if the Python backend is running
 */
export async function isBackendRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_URL}/ping`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Binance API Helpers ─────────────────────────────────────────────

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface BinanceKline {
  0: number;   // Open time
  1: string;   // Open
  2: string;   // High
  3: string;   // Low
  4: string;   // Close
  5: string;   // Volume
}

const BINANCE_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT",
  "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
  "DOTUSDT", "LINKUSDT", "MATICUSDT", "UNIUSDT",
];

export async function fetchBinanceTickers(): Promise<BinanceTicker[]> {
  const symbolsParam = BINANCE_SYMBOLS.join('","');
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=["${symbolsParam}"]`;

  const res = await fetch(url, {
    next: { revalidate: 15 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("Binance API error");
  return res.json();
}

export async function fetchBinanceKlines(
  symbol: string,
  interval: string = "1h",
  limit: number = 100
): Promise<BinanceKline[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("Binance klines API error");
  return res.json();
}

// ─── CoinGecko API Helpers ──────────────────────────────────────────

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  total_volume: number;
  market_cap: number;
}

export async function fetchCoinGeckoMarkets(): Promise<CoinGeckoCoin[]> {
  const ids =
    "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,chainlink,polygon-pos,uniswap";
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`;

  const res = await fetch(url, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("CoinGecko API error");
  return res.json();
}

// ─── Fear & Greed Index ─────────────────────────────────────────────

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData[]> {
  const url = "https://api.alternative.me/fng/?limit=7";

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("Fear & Greed API error");
  const data = await res.json();
  return data.data;
}

// ─── DexScreener API ────────────────────────────────────────────────

interface DexScreenerToken {
  chainId: string;
  dexId: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  priceChange: { h1: number; h6: number; h24: number };
  volume: { h24: number };
  liquidity: { usd: number };
  pairAddress: string;
}

export async function fetchTrendingTokens(): Promise<DexScreenerToken[]> {
  const url = "https://api.dexscreener.com/token-boosts/top/v1";

  const res = await fetch(url, {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("DexScreener API error");
  return res.json();
}

export async function fetchTokenProfiles(): Promise<any[]> {
  const url = "https://api.dexscreener.com/token-profiles/latest/v1";

  const res = await fetch(url, {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("DexScreener profiles API error");
  return res.json();
}

// ─── Binance News API ────────────────────────────────────────────────

interface BinanceNewsArticle {
  id: number;
  code: string;
  title: string;
  type: number;
  releaseDate: number;
}

interface BinanceNewsResponse {
  code: string;
  data: {
    catalogs: Array<{
      catalogId: number;
      catalogName: string;
      articles: BinanceNewsArticle[];
    }>;
  };
}

export async function fetchCryptoNews(): Promise<any[]> {
  // Use Binance's public CMS API (free, no key required)
  const url = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20";

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; OmniTrade/1.0)",
    },
  });

  if (!res.ok) throw new Error("Binance News API error");
  const data: BinanceNewsResponse = await res.json();

  const articles: any[] = [];
  if (data.data?.catalogs) {
    for (const catalog of data.data.catalogs) {
      for (const article of catalog.articles || []) {
        articles.push({
          id: article.id,
          title: article.title,
          url: `https://www.binance.com/en/news/flash/${article.code}`,
          source: "Binance",
          publishedAt: new Date(article.releaseDate).toISOString(),
          categories: catalog.catalogName,
        });
      }
    }
  }

  // Also try to get latest news from catalog 49 (Market Analysis)
  try {
    const url2 = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=49&pageNo=1&pageSize=10";
    const res2 = await fetch(url2, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; OmniTrade/1.0)",
      },
    });
    if (res2.ok) {
      const data2: BinanceNewsResponse = await res2.json();
      if (data2.data?.catalogs) {
        for (const catalog of data2.data.catalogs) {
          for (const article of catalog.articles || []) {
            articles.push({
              id: article.id + 10000, // avoid duplicate IDs
              title: article.title,
              url: `https://www.binance.com/en/news/flash/${article.code}`,
              source: "Binance",
              publishedAt: new Date(article.releaseDate).toISOString(),
              categories: catalog.catalogName,
            });
          }
        }
      }
    }
  } catch {
    // Secondary catalog fetch is optional
  }

  return articles.slice(0, 20);
}

// ─── Technical Analysis ─────────────────────────────────────────────

export function calculateRSI(closes: number[], period: number = 14): number {
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

export function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }
  return ema;
}

export function generateSignalFromAnalysis(
  symbol: string,
  closes: number[],
  currentPrice: number
) {
  const rsi = calculateRSI(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, Math.min(50, closes.length));
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  let action: "buy" | "sell" | "hold" = "hold";
  let confidence = 0.5;
  const reasons: string[] = [];

  if (rsi < 30) {
    action = "buy";
    confidence += 0.15;
    reasons.push(`RSI oversold at ${rsi.toFixed(1)}`);
  } else if (rsi > 70) {
    action = "sell";
    confidence += 0.15;
    reasons.push(`RSI overbought at ${rsi.toFixed(1)}`);
  } else if (rsi < 45) {
    action = "buy";
    confidence += 0.05;
    reasons.push(`RSI neutral-bullish at ${rsi.toFixed(1)}`);
  } else if (rsi > 55) {
    action = "sell";
    confidence += 0.05;
    reasons.push(`RSI neutral-bearish at ${rsi.toFixed(1)}`);
  }

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

  if (currentPrice > sma20) {
    if (action === "buy") confidence += 0.05;
    reasons.push("Price above SMA20");
  } else {
    if (action === "sell") confidence += 0.05;
    reasons.push("Price below SMA20");
  }

  confidence = Math.min(0.95, Math.max(0.15, confidence));

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

// ─── CoinGecko Symbol Map ───────────────────────────────────────────

export const COINGECKO_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC/USDT",
  ethereum: "ETH/USDT",
  solana: "SOL/USDT",
  binancecoin: "BNB/USDT",
  ripple: "XRP/USDT",
  cardano: "ADA/USDT",
  dogecoin: "DOGE/USDT",
  "avalanche-2": "AVAX/USDT",
  polkadot: "DOT/USDT",
  chainlink: "LINK/USDT",
  "polygon-pos": "MATIC/USDT",
  uniswap: "UNI/USDT",
};

export const BINANCE_SYMBOLS_LIST = BINANCE_SYMBOLS;
