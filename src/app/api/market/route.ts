import { NextResponse } from "next/server";

const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "DOTUSDT",
  "LINKUSDT",
  "MATICUSDT",
  "UNIUSDT",
];

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

export async function GET() {
  try {
    const symbolsParam = SYMBOLS.join('","');
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=["${symbolsParam}"]`;

    const response = await fetch(url, {
      next: { revalidate: 15 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // Fallback: try CoinGecko
      return await fetchFromCoinGecko();
    }

    const data: BinanceTicker[] = await response.json();

    const tickers = data.map((t) => ({
      symbol: t.symbol.replace("USDT", "/USDT"),
      price: parseFloat(t.lastPrice),
      change24h: parseFloat(t.priceChange),
      changePercent24h: parseFloat(t.priceChangePercent),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice),
      volume24h: parseFloat(t.volume),
      quoteVolume24h: parseFloat(t.quoteVolume),
    }));

    return NextResponse.json({
      tickers,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Binance API error:", error);
    return await fetchFromCoinGecko();
  }
}

async function fetchFromCoinGecko() {
  try {
    const ids = "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,chainlink,polygon-pos,uniswap";
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      next: { revalidate: 30 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch market data", tickers: [], lastUpdated: 0 },
        { status: 502 }
      );
    }

    interface CoinGeckoCoin {
      id: string;
      symbol: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      high_24h: number;
      low_24h: number;
      total_volume: number;
    }

    const data: CoinGeckoCoin[] = await response.json();

    const symbolMap: Record<string, string> = {
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

    const tickers = data.map((c) => ({
      symbol: symbolMap[c.id] || `${c.symbol.toUpperCase()}/USDT`,
      price: c.current_price,
      change24h: c.price_change_24h,
      changePercent24h: c.price_change_percentage_24h,
      high24h: c.high_24h,
      low24h: c.low_24h,
      volume24h: c.total_volume,
      quoteVolume24h: c.total_volume,
    }));

    return NextResponse.json({
      tickers,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("CoinGecko API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data", tickers: [], lastUpdated: 0 },
      { status: 502 }
    );
  }
}
