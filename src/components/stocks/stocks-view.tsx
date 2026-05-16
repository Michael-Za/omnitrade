'use client';

import { useState, useEffect } from 'react';
import { omnitradeApi } from '@/lib/api/omnitrade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockData, TechnicalIndicators } from '@/lib/api/types';

const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD'];
const SECTOR_COLORS: Record<string, string> = {
  Technology: 'border-primary/50 text-primary',
  Healthcare: 'border-emerald-500/50 text-emerald-400',
  Finance: 'border-amber-500/50 text-amber-400',
  Consumer: 'border-purple-500/50 text-purple-400',
  Energy: 'border-red-500/50 text-red-400',
  Industrial: 'border-cyan-500/50 text-cyan-400',
};

export function StocksView() {
  const [stocks, setStocks] = useState<Record<string, StockData>>({});
  const [indicators, setIndicators] = useState<Record<string, TechnicalIndicators>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await omnitradeApi.getStocks();
    if (data) setStocks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      omnitradeApi.getIndicators(selectedSymbol, '1d').then((ind) => {
        if (ind) setIndicators((prev) => ({ ...prev, [selectedSymbol]: ind }));
      });
    }
  }, [selectedSymbol]);

  const stockEntries = Object.entries(stocks);
  const sectors = [...new Set(stockEntries.map(([_, s]) => s.sector).filter(Boolean))];

  const selectedStock = selectedSymbol ? stocks[selectedSymbol] : null;
  const selectedIndicators = selectedSymbol ? indicators[selectedSymbol] : null;

  // Market regime based on SPY/QQQ
  const spy = stocks['SPY'];
  const qqq = stocks['QQQ'];
  const marketTrend = spy && qqq
    ? (spy.change_pct > 0 && qqq.change_pct > 0 ? 'BULLISH' : spy.change_pct < 0 && qqq.change_pct < 0 ? 'BEARISH' : 'MIXED')
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Stocks
        </h1>
        <p className="text-sm text-muted-foreground">Real-time stock market data powered by yfinance</p>
      </div>

      {/* Market Regime Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Market Regime (SPY/QQQ)</div>
            <div className="flex items-center gap-2">
              {marketTrend === 'BULLISH' ? (
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              ) : marketTrend === 'BEARISH' ? (
                <TrendingDown className="h-5 w-5 text-red-400" />
              ) : (
                <BarChart3 className="h-5 w-5 text-amber-400" />
              )}
              <span className={cn(
                'text-lg font-bold',
                marketTrend === 'BULLISH' ? 'text-emerald-400' :
                marketTrend === 'BEARISH' ? 'text-red-400' : 'text-amber-400'
              )}>
                {marketTrend ?? '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {spy && (
          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">SPY</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">${spy.price.toFixed(2)}</span>
                <span className={cn('text-sm font-medium', spy.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {spy.change_pct >= 0 ? '+' : ''}{spy.change_pct.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {qqq && (
          <Card className="card-glow">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">QQQ</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">${qqq.price.toFixed(2)}</span>
                <span className={cn('text-sm font-medium', qqq.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {qqq.change_pct >= 0 ? '+' : ''}{qqq.change_pct.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock List */}
        <div className="lg:col-span-1">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading && stockEntries.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 animate-pulse">
                      <div className="h-4 bg-muted rounded w-16" />
                      <div className="h-4 bg-muted rounded w-20" />
                    </div>
                  ))
                ) : stockEntries.length > 0 ? (
                  stockEntries.map(([symbol, data]) => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      className={cn(
                        'flex items-center justify-between w-full p-2 rounded-md text-xs transition-colors',
                        selectedSymbol === symbol ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{symbol}</span>
                        <Badge variant="outline" className={cn('text-[10px] px-1', SECTOR_COLORS[data.sector] || '')}>
                          {data.sector?.slice(0, 4) || '—'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${data.price.toFixed(2)}</div>
                        <div className={cn('font-mono', data.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {data.change_pct >= 0 ? '+' : ''}{data.change_pct.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No stock data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Detail */}
        <div className="lg:col-span-2 space-y-3">
          {selectedStock ? (
            <>
              {/* Stock Header */}
              <Card className="card-glow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        {selectedSymbol}
                        <Badge variant="outline" className="text-xs">{selectedStock.sector}</Badge>
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</span>
                        <span className={cn(
                          'text-lg font-semibold',
                          selectedStock.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {selectedStock.change_pct >= 0 ? '+' : ''}{selectedStock.change_pct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Volume</span>
                      <div className="font-medium">{(selectedStock.volume / 1e6).toFixed(1)}M</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Market Cap</span>
                      <div className="font-medium">{selectedStock.market_cap > 1e12 ? `${(selectedStock.market_cap / 1e12).toFixed(1)}T` : `${(selectedStock.market_cap / 1e9).toFixed(1)}B`}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P/E Ratio</span>
                      <div className="font-medium">{selectedStock.pe_ratio?.toFixed(1) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sector</span>
                      <div className="font-medium">{selectedStock.sector}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              {selectedIndicators && (
                <Card className="card-glow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Technical Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <IndicatorCard label="RSI (14)" value={selectedIndicators.rsi_14?.toFixed(1) ?? '—'} status={selectedIndicators.rsi_14 > 70 || selectedIndicators.rsi_14 < 30 ? 'warning' : 'normal'} />
                      <IndicatorCard label="ATR %" value={`${selectedIndicators.atr_pct?.toFixed(2) ?? '—'}%`} status="normal" />
                      <IndicatorCard label="BB Width" value={selectedIndicators.bb_width?.toFixed(3) ?? '—'} status="normal" />
                      <IndicatorCard label="VWAP" value={selectedIndicators.vwap?.toFixed(2) ?? '—'} status="normal" />
                      <IndicatorCard label="EMA 20" value={selectedIndicators.ema_20?.toFixed(2) ?? '—'} status="normal" />
                      <IndicatorCard label="EMA 50" value={selectedIndicators.ema_50?.toFixed(2) ?? '—'} status="normal" />
                      <IndicatorCard label="MACD Hist" value={selectedIndicators.macd_histogram?.toFixed(2) ?? '—'} status={selectedIndicators.macd_histogram > 0 ? 'bullish' : 'bearish'} />
                      <IndicatorCard label="Volatility" value={selectedIndicators.volatility ?? '—'} status={selectedIndicators.volatility === 'HIGH' ? 'warning' : 'normal'} />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Trend:</span>
                      <Badge variant="outline" className={cn(
                        'text-[10px] px-1.5',
                        selectedIndicators.trend === 'UP' ? 'border-emerald-500/50 text-emerald-400' :
                        selectedIndicators.trend === 'DOWN' ? 'border-red-500/50 text-red-400' :
                        'border-amber-500/50 text-amber-400'
                      )}>
                        {selectedIndicators.trend}
                      </Badge>
                      <span className="text-muted-foreground ml-2">Phase:</span>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {selectedIndicators.phase}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sector Comparison */}
              <Card className="card-glow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {selectedStock.sector} Sector
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {stockEntries
                      .filter(([_, s]) => s.sector === selectedStock.sector)
                      .map(([symbol, data]) => (
                        <div key={symbol} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs">
                          <span className="font-medium">{symbol}</span>
                          <span className={cn('font-mono', data.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                            {data.change_pct >= 0 ? '+' : ''}{data.change_pct.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select a stock to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ label, value, status }: { label: string; value: string; status: 'normal' | 'warning' | 'bullish' | 'bearish' }) {
  return (
    <div className="p-2 rounded-md bg-muted/50 border border-border">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn(
        'font-medium text-sm',
        status === 'warning' ? 'text-amber-400' :
        status === 'bullish' ? 'text-emerald-400' :
        status === 'bearish' ? 'text-red-400' : ''
      )}>
        {value}
      </div>
    </div>
  );
}
