import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return system status based on local state
    // In production, this would query the Python backend
    const status = {
      state: "stopped" as const,
      uptime: 0,
      exchangeConnected: false,
      activePositions: 0,
      totalTrades: 0,
      llmAvailable: false,
      version: "1.0.0",
    };

    return NextResponse.json({
      ...status,
      timestamp: Date.now(),
    });
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
        error: "Failed to get system status",
      },
      { status: 500 }
    );
  }
}
