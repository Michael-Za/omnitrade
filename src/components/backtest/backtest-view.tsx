'use client';

import { useState, useEffect } from 'react';
import { vibeTradingApi } from '@/lib/api/vibe-trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, Play, BarChart3, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RunListItem, RunData, BacktestMetrics, EquityPoint, ValidationData } from '@/lib/api/types';

export function BacktestView() {
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);

  // Backtest config
  const [config, setConfig] = useState({
    symbol: 'BTC/USDT',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: '10000',
    strategy: 'momentum',
    timeframe: '1d',
  });

  const loadRuns = async () => {
    setLoading(true);
    const data = await vibeTradingApi.listRuns();
    if (data) setRuns(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      vibeTradingApi.getRun(selectedRunId).then((run) => {
        if (run) setSelectedRun(run);
      });
    }
  }, [selectedRunId]);

  const metrics = selectedRun?.metrics;
  const equityCurve = selectedRun?.equity_curve;
  const validation = selectedRun?.validation;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" /> Backtest
        </h1>
        <p className="text-sm text-muted-foreground">Strategy backtesting engine with funding fees, liquidation, and maker/taker simulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Strategy Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Symbol</label>
                <Input
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={config.endDate}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Initial Capital</label>
                <Input
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Strategy</label>
                <Select value={config.strategy} onValueChange={(v) => setConfig({ ...config, strategy: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momentum">Momentum</SelectItem>
                    <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                    <SelectItem value="breakout">Breakout</SelectItem>
                    <SelectItem value="rsi">RSI Strategy</SelectItem>
                    <SelectItem value="macd">MACD Cross</SelectItem>
                    <SelectItem value="bb">Bollinger Band</SelectItem>
                    <SelectItem value="ichimoku">Ichimoku</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Timeframe</label>
                <Select value={config.timeframe} onValueChange={(v) => setConfig({ ...config, timeframe: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="1d">1d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full text-xs h-8">
                <Play className="h-3 w-3 mr-1" /> Run Backtest
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Use the AI Agent to create and run backtests via chat
              </p>
            </CardContent>
          </Card>

          {/* Historical Runs */}
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Historical Runs</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {runs.length > 0 ? runs.map((run) => (
                  <button
                    key={run.run_id}
                    onClick={() => setSelectedRunId(run.run_id)}
                    className={cn(
                      'w-full text-left p-2 rounded-md text-xs transition-colors',
                      selectedRunId === run.run_id ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]">{run.run_id.slice(0, 16)}</span>
                      <Badge variant="outline" className={cn(
                        'text-[10px] px-1',
                        run.status === 'success' ? 'border-emerald-500/50 text-emerald-400' :
                        run.status === 'failed' ? 'border-red-500/50 text-red-400' : ''
                      )}>
                        {run.status}
                      </Badge>
                    </div>
                    {run.prompt && (
                      <p className="text-muted-foreground truncate mt-0.5 text-[10px]">{run.prompt}</p>
                    )}
                    {run.total_return != null && (
                      <span className={cn('font-mono', run.total_return >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {run.total_return >= 0 ? '+' : ''}{(run.total_return * 100).toFixed(1)}%
                      </span>
                    )}
                  </button>
                )) : (
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    No runs yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-3">
          {selectedRun && metrics ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <MetricCard label="Total Return" value={`${(metrics.total_return * 100).toFixed(1)}%`} positive={metrics.total_return >= 0} />
                <MetricCard label="Annual Return" value={`${(metrics.annual_return * 100).toFixed(1)}%`} positive={metrics.annual_return >= 0} />
                <MetricCard label="Max Drawdown" value={`${(metrics.max_drawdown * 100).toFixed(1)}%`} positive={false} />
                <MetricCard label="Sharpe Ratio" value={metrics.sharpe.toFixed(2)} positive={metrics.sharpe >= 1} />
                <MetricCard label="Win Rate" value={`${(metrics.win_rate * 100).toFixed(1)}%`} positive={metrics.win_rate >= 0.5} />
                <MetricCard label="Trades" value={metrics.trade_count.toString()} />
              </div>

              <Tabs defaultValue="equity">
                <TabsList>
                  <TabsTrigger value="equity" className="text-xs">Equity Curve</TabsTrigger>
                  <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
                  <TabsTrigger value="trades" className="text-xs">Trade Log</TabsTrigger>
                </TabsList>

                {/* Equity Curve */}
                <TabsContent value="equity" className="mt-3">
                  <Card className="card-glow">
                    <CardContent className="p-4">
                      {equityCurve && equityCurve.length > 0 ? (
                        <div className="space-y-3">
                          {/* Simple SVG equity chart */}
                          <div className="h-64 relative">
                            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                              {(() => {
                                const values = equityCurve.map((p) => Number(p.equity));
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const range = max - min || 1;
                                const points = values.map((v, i) =>
                                  `${(i / (values.length - 1)) * 800},${200 - ((v - min) / range) * 180}`
                                ).join(' ');
                                return (
                                  <>
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="oklch(0.75 0.15 195)"
                                      strokeWidth="2"
                                    />
                                    {/* Drawdown area */}
                                    {equityCurve.some((p) => Number(p.drawdown) < 0) && (
                                      <polyline
                                        points={equityCurve.map((p, i) => {
                                          const dd = Math.abs(Number(p.drawdown));
                                          return `${(i / (equityCurve.length - 1)) * 800},${200 - (dd / range) * 180}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="oklch(0.704 0.191 22.216)"
                                        strokeWidth="1"
                                        opacity="0.5"
                                      />
                                    )}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-0.5 bg-primary" /> Equity
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-0.5 bg-red-400 opacity-50" /> Drawdown
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground text-xs">
                          No equity curve data
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Validation */}
                <TabsContent value="validation" className="mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {validation?.monte_carlo && (
                      <Card className="card-glow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Monte Carlo</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <div>P-value Sharpe: <span className="font-medium">{validation.monte_carlo.p_value_sharpe.toFixed(3)}</span></div>
                          <div>P-value Max DD: <span className="font-medium">{validation.monte_carlo.p_value_max_dd.toFixed(3)}</span></div>
                          <div>Simulations: <span className="font-medium">{validation.monte_carlo.n_simulations}</span></div>
                          <div>Sim Sharpe μ: <span className="font-medium">{validation.monte_carlo.simulated_sharpe_mean.toFixed(2)}</span></div>
                          {validation.monte_carlo.error && (
                            <div className="text-red-400 text-[10px]">{validation.monte_carlo.error}</div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {validation?.bootstrap && (
                      <Card className="card-glow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Bootstrap</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <div>CI Lower: <span className="font-medium">{validation.bootstrap.ci_lower.toFixed(2)}</span></div>
                          <div>CI Upper: <span className="font-medium">{validation.bootstrap.ci_upper.toFixed(2)}</span></div>
                          <div>Prob Positive: <span className="font-medium">{(validation.bootstrap.prob_positive * 100).toFixed(1)}%</span></div>
                          <div>Confidence: <span className="font-medium">{(validation.bootstrap.confidence * 100).toFixed(0)}%</span></div>
                          {validation.bootstrap.error && (
                            <div className="text-red-400 text-[10px]">{validation.bootstrap.error}</div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {validation?.walk_forward && (
                      <Card className="card-glow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Walk-Forward</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <div>Windows: <span className="font-medium">{validation.walk_forward.n_windows}</span></div>
                          <div>Profitable: <span className="font-medium">{validation.walk_forward.profitable_windows}/{validation.walk_forward.n_windows}</span></div>
                          <div>Consistency: <span className="font-medium">{(validation.walk_forward.consistency_rate * 100).toFixed(1)}%</span></div>
                          <div>Sharpe μ: <span className="font-medium">{validation.walk_forward.sharpe_mean.toFixed(2)}</span></div>
                          {validation.walk_forward.error && (
                            <div className="text-red-400 text-[10px]">{validation.walk_forward.error}</div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {!validation && (
                      <div className="col-span-full text-center py-8 text-muted-foreground text-xs">
                        No validation data for this run
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Trade Log */}
                <TabsContent value="trades" className="mt-3">
                  <Card className="card-glow">
                    <CardContent className="p-2">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {selectedRun.trade_log && selectedRun.trade_log.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b border-border">
                                <th className="text-left p-1.5">#</th>
                                <th className="text-left p-1.5">Timestamp</th>
                                <th className="text-left p-1.5">Side</th>
                                <th className="text-right p-1.5">Price</th>
                                <th className="text-right p-1.5">Qty</th>
                                <th className="text-right p-1.5">PnL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRun.trade_log.slice(0, 100).map((trade, i) => (
                                <tr key={i} className="border-b border-border/50">
                                  <td className="p-1.5">{i + 1}</td>
                                  <td className="p-1.5 font-mono">{trade.timestamp || trade.date || '—'}</td>
                                  <td className={cn('p-1.5 font-medium', trade.side === 'BUY' ? 'text-emerald-400' : 'text-red-400')}>
                                    {trade.side || '—'}
                                  </td>
                                  <td className="p-1.5 text-right font-mono">{trade.price || '—'}</td>
                                  <td className="p-1.5 text-right font-mono">{trade.qty || trade.quantity || '—'}</td>
                                  <td className={cn('p-1.5 text-right font-mono', Number(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                    {trade.pnl || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">No trade log data</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <FlaskConical className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a run to view results</p>
              <p className="text-sm mt-1">Or use the AI Agent to create and run backtests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <Card className="card-glow">
      <CardContent className="p-3">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className={cn(
          'text-sm font-bold',
          positive === true ? 'text-emerald-400' :
          positive === false ? 'text-red-400' : ''
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
