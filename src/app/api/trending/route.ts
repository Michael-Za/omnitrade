import { NextResponse } from "next/server";
import { fetchTrendingTokens, fetchTokenProfiles } from "@/lib/backend";

export async function GET() {
  try {
    // Fetch real trending tokens from DexScreener
    const [boostedTokens, latestProfiles] = await Promise.allSettled([
      fetchTrendingTokens(),
      fetchTokenProfiles(),
    ]);

    const tokens = boostedTokens.status === "fulfilled" ? boostedTokens.value : [];
    const profiles = latestProfiles.status === "fulfilled" ? latestProfiles.value : [];

    // Merge token boost data with profile data
    const trendingList = tokens.slice(0, 20).map((token: any) => {
      const profile = profiles.find(
        (p: any) => p.tokenAddress === token.tokenAddress && p.chainId === token.chainId
      );

      return {
        id: `${token.chainId}-${token.tokenAddress}`,
        name: token.name || profile?.name || "Unknown",
        symbol: token.symbol || profile?.symbol || "???",
        chainId: token.chainId,
        description: token.description || profile?.description || null,
        links: token.links || profile?.links || null,
        icon: token.icon || profile?.icon || null,
        banner: token.banner || profile?.banner || null,
      };
    });

    return NextResponse.json({
      tokens: trendingList,
      count: trendingList.length,
      source: "dexscreener",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { tokens: [], count: 0, source: "error", timestamp: Date.now() },
      { status: 500 }
    );
  }
}
