import { NextResponse } from "next/server";
import { fetchFromBackend, fetchCryptoNews } from "@/lib/backend";

export async function GET() {
  try {
    // Try Python backend first (may have richer news from yfinance/Alpha Vantage)
    const backendNews = await fetchFromBackend<any>("/api/v1/news");
    if (backendNews && backendNews.articles && backendNews.articles.length > 0) {
      return NextResponse.json({
        articles: backendNews.articles,
        source: "backend",
        timestamp: Date.now(),
      });
    }

    // Fetch real crypto news from Binance CMS API
    const newsItems = await fetchCryptoNews();

    return NextResponse.json({
      articles: newsItems,
      count: newsItems.length,
      source: "binance",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { articles: [], count: 0, source: "error", timestamp: Date.now() },
      { status: 500 }
    );
  }
}
