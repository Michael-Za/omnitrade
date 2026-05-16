'use client';

import { useState, useEffect } from 'react';
import { omnitradeApi } from '@/lib/api/omnitrade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, TrendingUp, TrendingDown, MessageSquare, Search, AlertTriangle, Eye, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { MemeCoinAnalysis } from '@/lib/api/types';

export function MemeCoinsView() {
  const [memeCoins, setMemeCoins] = useState<Record<string, MemeCoinAnalysis>>({});
  const [sentiment, setSentiment] = useState<{
    trending: Array<{ coin_id: string; name: string; symbol: string; market_cap_rank: number }>;
    reddit_posts: Array<{ title: string; sentiment: string; score: number; url: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [coinsData, sentimentData] = await Promise.all([
      omnitradeApi.getMemeCoins(),
      omnitradeApi.getSentiment(),
    ]);
    if (coinsData) setMemeCoins(coinsData);
    if (sentimentData) setSentiment(sentimentData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memeEntries = Object.entries(memeCoins);
  const filteredEntries = searchFilter
    ? memeEntries.filter(([sym, data]) =>
        sym.toLowerCase().includes(searchFilter.toLowerCase()) ||
        data.symbol.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : memeEntries;

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-emerald-400';
    if (score <= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'LOW';
    if (score <= 6) return 'MEDIUM';
    return 'HIGH';
  };

  const getSentimentColor = (trend: string) => {
    if (trend === 'BULLISH') return 'text-emerald-400';
    if (trend === 'BEARISH') return 'text-red-400';
    return 'text-amber-400';
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Meme Coins
          </h1>
          <p className="text-sm text-muted-foreground">Trending tokens, sentiment analysis, and risk scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-7 h-8 w-48 text-xs"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="scanner">
        <TabsList>
          <TabsTrigger value="scanner" className="text-xs">Scanner</TabsTrigger>
          <TabsTrigger value="trending" className="text-xs">Trending</TabsTrigger>
          <TabsTrigger value="sentiment" className="text-xs">Sentiment</TabsTrigger>
          <TabsTrigger value="smart-money" className="text-xs">Smart Money</TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="mt-4">
          {loading && memeEntries.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredEntries.map(([symbol, data]) => (
                <Card key={symbol} className="card-glow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">{data.symbol}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5', getRiskColor(data.risk_score))}
                      >
                        {getRiskLabel(data.risk_score)} RISK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${data.price_usd < 0.01 ? data.price_usd.toExponential(2) : data.price_usd.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      {data.sentiment && (
                        <span className={cn('text-xs font-medium', getSentimentColor(data.sentiment.sentiment_trend))}>
                          {data.sentiment.sentiment_trend}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">MCap</span>
                        <div className="font-medium">${(data.market_cap / 1e6).toFixed(1)}M</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume 24h</span>
                        <div className="font-medium">${(data.volume_24h / 1e6).toFixed(1)}M</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Liquidity</span>
                        <div className="font-medium">${(data.liquidity / 1e3).toFixed(0)}K</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk Score</span>
                        <div className={cn('font-medium', getRiskColor(data.risk_score))}>{data.risk_score}/10</div>
                      </div>
                    </div>

                    {/* Risk Bar */}
                    <div className="mt-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            data.risk_score <= 3 ? 'bg-emerald-500' :
                            data.risk_score <= 6 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${data.risk_score * 10}%` }}
                        />
                      </div>
                    </div>

                    {data.sentiment && (
                      <div className="mt-1 pt-2 border-t border-border text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {data.sentiment.mention_count_24h} mentions · Score: {data.sentiment.sentiment_score.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No meme coin data available</p>
              <p className="text-xs mt-1">Connect to Omnitrade backend for live data</p>
            </div>
          )}
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Trending on CoinGecko
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sentiment?.trending && sentiment.trending.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {sentiment.trending.map((coin) => (
                    <div key={coin.coin_id} className="p-2 rounded-lg bg-muted/50 border border-border text-xs">
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-muted-foreground">{coin.symbol?.toUpperCase()}</div>
                      {coin.market_cap_rank && (
                        <Badge variant="outline" className="text-[10px] px-1 mt-1">#{coin.market_cap_rank}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No trending data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Reddit Crypto Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sentiment?.reddit_posts && sentiment.reddit_posts.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {sentiment.reddit_posts.map((post, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/50 border border-border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate mr-2">{post.title}</span>
                        <Badge variant="outline" className={cn(
                          'text-[10px] px-1.5 flex-shrink-0',
                          post.sentiment === 'BULLISH' ? 'border-emerald-500/50 text-emerald-400' :
                          post.sentiment === 'BEARISH' ? 'border-red-500/50 text-red-400' :
                          'border-amber-500/50 text-amber-400'
                        )}>
                          {post.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Score: {post.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No Reddit sentiment data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Money Tab */}
        <TabsContent value="smart-money" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEntries
              .filter(([_, data]) => data.smart_money_inflow !== 0)
              .sort(([_, a], [__, b]) => Math.abs(b.smart_money_inflow) - Math.abs(a.smart_money_inflow))
              .slice(0, 12)
              .map(([symbol, data]) => (
                <Card key={symbol} className="card-glow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold">{data.symbol}</span>
                      </div>
                      <span className={cn(
                        'text-sm font-bold',
                        data.smart_money_inflow > 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {data.smart_money_inflow > 0 ? '+' : ''}{(data.smart_money_inflow / 1e3).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Smart Money Flow</span>
                      {data.smart_money_inflow > 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            {filteredEntries.filter(([_, d]) => d.smart_money_inflow !== 0).length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No smart money data available</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
