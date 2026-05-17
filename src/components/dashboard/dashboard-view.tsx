'use client';

import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Activity, Shield, Zap, AlertTriangle, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardView() {
  const { wsData, omnitradeStatus } = useAppStore();

  const scanners = wsData?.scanners;
  const prices = wsData?.prices;
  const health = wsData?.health ?? 0;
  const metrics = wsData?.metrics;
  const bots = wsData?.bots ?? [];
  const mode = wsData?.mode;
  const logs = wsData?.logs ?? [];
  const indicators = wsData?.indicators ?? {};

  const isLive = omnitradeStatus === 'connected';

  // Price ticker data
  const priceEntries = Object.entries(prices ?? {});
  const activeBots = bots.filter((b) => b.active);
  const guardianBot = bots.find((b) => b.isGuardian);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      {/* Price Ticker Bar */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {priceEntries.length > 0 ? (
          priceEntries.map(([symbol, data]) => (
            <div
              key={symbol}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border flex-shrink-0 card-glow"
            >
              <span className="text-xs font-medium text-muted-foreground">{symbol.replace('/USDT', '')}</span>
              <span className="text-sm font-mono font-semibold">
                ${typeof data.price === 'number' ? data.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </span>
              {typeof data.change_pct_24h === 'number' && (
                <span
                  className={cn(
                    'text-xs font-mono flex items-center gap-0.5',
                    data.change_pct_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {data.change_pct_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(data.change_pct_24h).toFixed(2)}%
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-muted-foreground text-xs">
            {isLive ? 'Loading prices...' : 'Backend offline — connect to Omnitrade backend on port 8000'}
          </div>
        )}
      </div>

      {/* Top Row: Market Regime + Health Score + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Market Regime */}
        <Card className="card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Market Regime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {scanners?.phase === 'ACCUMULATION' ? '📦 Accumulation' :
                 scanners?.phase === 'EXPANSION' ? '🚀 Expansion' :
                 scanners?.phase === 'DISTRIBUTION' ? '📤 Distribution' :
                 scanners?.phase === 'RESET' ? '🔄 Reset' :
                 '—'}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  scanners?.trend === 'UP' ? 'border-emerald-500/50 text-emerald-400' :
                  scanners?.trend === 'DOWN' ? 'border-red-500/50 text-red-400' :
                  'border-yellow-500/50 text-yellow-400'
                )}
              >
                {scanners?.trend ?? '—'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Volatility</span>
                <div className={cn('font-medium', scanners?.volatility === 'HIGH' ? 'text-amber-400' : 'text-emerald-400')}>
                  {scanners?.volatility ?? '—'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Session</span>
                <div className="font-medium">{scanners?.clock ?? '—'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cycle</span>
                <div className="font-medium">{scanners?.cycle ?? '—'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Uncertainty</span>
                <div className={cn(
                  'font-medium',
                  scanners?.uncertainty === 'CRITICAL' ? 'text-red-400' :
                  scanners?.uncertainty === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  {scanners?.uncertainty ?? '—'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Health Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-3xl font-bold',
                health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-red-400'
              )}>
                {health.toFixed(0)}
              </span>
              <Badge variant="outline" className="text-xs">
                {mode ?? '—'}
              </Badge>
            </div>
            <Progress
              value={health}
              className={cn(
                'h-2',
                health >= 80 ? '[&>div]:bg-emerald-500' :
                health >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
              )}
            />
            <div className="text-xs text-muted-foreground">
              Governance: {wsData?.governance_rules?.bot_status ?? '—'}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">PnL</span>
                <div className={cn(
                  'font-semibold text-sm',
                  (metrics?.total_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  ${(metrics?.total_pnl ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Win Rate</span>
                <div className="font-semibold text-sm">
                  {((metrics?.win_rate ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Drawdown</span>
                <div className={cn('font-semibold text-sm', (metrics?.drawdown ?? 0) > 10 ? 'text-red-400' : '')}>
                  {(metrics?.drawdown ?? 0).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Sharpe</span>
                <div className="font-semibold text-sm">
                  {(metrics?.sharpe_ratio ?? 0).toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Max DD</span>
                <div className="font-semibold text-sm text-red-400">
                  {(metrics?.max_drawdown ?? 0).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Positions</span>
                <div className="font-semibold text-sm">
                  {metrics?.open_positions ?? 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Bots Summary */}
        <Card className="card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Active Bots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">{activeBots.length}</span>
              <span className="text-xs text-muted-foreground">/ {bots.length} total</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {activeBots.slice(0, 5).map((bot) => (
                <div key={bot.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{bot.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5',
                      bot.risk === 'LOW' ? 'border-emerald-500/50 text-emerald-400' :
                      bot.risk === 'MED' ? 'border-amber-500/50 text-amber-400' :
                      'border-red-500/50 text-red-400'
                    )}
                  >
                    {bot.risk}
                  </Badge>
                </div>
              ))}
            </div>
            {guardianBot && (
              <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className={cn('h-3 w-3', guardianBot.active ? 'text-amber-400' : 'text-muted-foreground')} />
                Guardian: {guardianBot.active ? 'ACTIVE' : 'INACTIVE'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Technical Indicators + AI Advice + Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Technical Indicators */}
        <Card className="card-glow lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Technical Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(indicators).length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {Object.entries(indicators).slice(0, 6).map(([symbol, ind]) => (
                  <div key={symbol} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{symbol.replace('/USDT', '')}</span>
                      <Badge variant="outline" className="text-[10px] px-1">
                        {ind.trend}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <span>RSI: <span className={ind.rsi_14 > 70 || ind.rsi_14 < 30 ? 'text-amber-400' : 'text-foreground'}>{ind.rsi_14?.toFixed(1)}</span></span>
                      <span>ATR: <span className="text-foreground">{ind.atr_pct?.toFixed(2)}%</span></span>
                      <span>BB: <span className="text-foreground">{ind.bb_width?.toFixed(3)}</span></span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <span>EMA20: <span className="text-foreground">{ind.ema_20?.toFixed(0)}</span></span>
                      <span>EMA50: <span className="text-foreground">{ind.ema_50?.toFixed(0)}</span></span>
                      <span>MACD: <span className={ind.macd_histogram > 0 ? 'text-emerald-400' : 'text-red-400'}>{ind.macd_histogram?.toFixed(1)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No indicator data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Advice Panel */}
        <Card className="card-glow lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs">
              {scanners ? (
                <>
                  <div className="p-2 rounded-md bg-muted/50 border border-border">
                    <div className="font-medium mb-1">Market Assessment</div>
                    <p className="text-muted-foreground leading-relaxed">
                      {scanners.trend === 'UP' && scanners.phase === 'EXPANSION'
                        ? 'Strong uptrend in expansion phase. Momentum strategies favored. Consider trend-following bots.'
                        : scanners.trend === 'DOWN' && scanners.volatility === 'HIGH'
                        ? 'High-volatility downtrend detected. Defensive posture recommended. Reduce position sizes.'
                        : scanners.uncertainty === 'CRITICAL'
                        ? 'Critical uncertainty level. All non-guardian bots should be paused. Wait for clarity.'
                        : scanners.phase === 'ACCUMULATION'
                        ? 'Accumulation phase detected. Range-bound strategies may work. Watch for breakout signals.'
                        : 'Market in transition. Monitor indicators closely for directional signals.'}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 border border-border">
                    <div className="font-medium mb-1">Recommended Actions</div>
                    <ul className="text-muted-foreground space-y-1">
                      {health < 50 && <li className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-400" /> Reduce exposure immediately</li>}
                      {scanners.volatility === 'HIGH' && <li className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-400" /> Use volatility breakout strategies</li>}
                      {scanners.trend === 'NEUTRAL' && <li className="flex items-center gap-1"><Minus className="h-3 w-3" /> Range scalper may be effective</li>}
                      {health >= 80 && <li className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" /> Full trading permission granted</li>}
                    </ul>
                  </div>
                  {scanners.correlation && scanners.correlation.stress_index > 0.7 && (
                    <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
                      <div className="font-medium text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Correlation Stress
                      </div>
                      <p className="text-red-300/70 mt-1">
                        Stress index at {(scanners.correlation.stress_index * 100).toFixed(0)}%. Assets moving in lockstep — diversification risk.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Connect to backend for AI analysis
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions / Logs */}
        <Card className="card-glow lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {logs.length > 0 ? (
                logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground font-mono w-12 flex-shrink-0">{log.timestamp}</span>
                    <span className="font-medium flex-shrink-0">{log.bot}</span>
                    <span className="text-muted-foreground truncate">{log.action}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1 ml-auto flex-shrink-0',
                        log.status === 'SUCCESS' ? 'border-emerald-500/50 text-emerald-400' :
                        log.status === 'WARNING' ? 'border-amber-500/50 text-amber-400' :
                        'border-red-500/50 text-red-400'
                      )}
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No recent actions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Rotation */}
      {scanners?.rotation && scanners.rotation.length > 0 && (
        <Card className="card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Token Rotation Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {scanners.rotation.map((token) => (
                <div key={token.ticker} className="p-2 rounded-lg bg-muted/50 border border-border text-xs">
                  <div className="font-medium">{token.ticker}</div>
                  <div className="text-muted-foreground">${token.price_usd?.toFixed(4) ?? '—'}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn(token.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {token.change_pct >= 0 ? '+' : ''}{token.change_pct?.toFixed(1)}%
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1">{token.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
