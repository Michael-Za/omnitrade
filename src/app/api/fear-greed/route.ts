import { NextResponse } from "next/server";
import { fetchFearGreedIndex } from "@/lib/backend";

export async function GET() {
  try {
    // Fetch real Fear & Greed Index from alternative.me
    const data = await fetchFearGreedIndex();

    const current = data[0];
    const history = data.slice(1).map((item) => ({
      value: parseInt(item.value),
      classification: item.value_classification,
      timestamp: parseInt(item.timestamp) * 1000,
      date: new Date(parseInt(item.timestamp) * 1000).toISOString().split("T")[0],
    }));

    return NextResponse.json({
      current: {
        value: parseInt(current.value),
        classification: current.value_classification,
        timestamp: parseInt(current.timestamp) * 1000,
        date: new Date(parseInt(current.timestamp) * 1000).toISOString().split("T")[0],
      },
      history,
      source: "alternative.me",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Fear & Greed API error:", error);
    return NextResponse.json(
      {
        current: null,
        history: [],
        source: "error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
