import React from 'react';
import { ScannerState, MarketPhase, TrendState, ClockSession, TokenRotation, CorrelationData, TickerPrice } from '../types';

interface ScannerPanelProps {
  state: ScannerState;
  rotation?: TokenRotation[];
  correlation?: CorrelationData | null;
}

const ScannerPanel: React.FC<ScannerPanelProps> = ({ state, rotation, correlation }) => {
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs lg:text-sm font-bold uppercase tracking-[0.5em] text-muted">Global Intel Stream</h2>
        <div className="flex items-center gap-6 lg:gap-8">
          <span className="hidden sm:inline text-xs font-mono-data text-green-400 font-bold">DATA: LIVE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/5 border border-white/5 rounded-sm overflow-hidden shadow-2xl">
        {/* Regime */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Market Regime</span>
          <div>
            <div className={`text-base font-bold mb-1 tracking-tight ${state.trend === TrendState.UP ? 'text-green-400' : state.trend === TrendState.DOWN ? 'text-red-400' : 'text-primary'}`}>{state.trend} MOMENTUM</div>
            <div className={`text-xs font-mono-data uppercase font-bold tracking-widest ${state.volatility === 'HIGH' ? 'text-yellow-400' : 'text-muted'}`}>{state.volatility} VOL</div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Session</span>
          <div className="flex items-baseline gap-4">
            <span className="text-2xl font-bold text-primary tracking-tight leading-none">{state.clock}</span>
            <span className="text-xs text-muted font-mono-data uppercase font-bold">{state.cycle}</span>
          </div>
        </div>

        {/* Alpha Strength - Real rotation data */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Alpha Dist.</span>
          <div className="space-y-2 lg:space-y-3 overflow-y-auto no-scrollbar max-h-[120px]">
            {(rotation || []).slice(0, 5).map(s => (
              <div key={s.ticker} className="flex justify-between items-center text-xs font-mono-data font-bold">
                <span className="text-muted uppercase">{s.ticker}</span>
                <div className="flex items-center gap-2">
                  {s.price_usd > 0 && <span className="text-secondary">${formatPrice(s.price_usd)}</span>}
                  <span className={`${s.strength >= 0 ? 'text-green-400' : 'text-red-400'}`}>{s.strength >= 0 ? '+' : ''}{s.strength.toFixed(2)}%</span>
                </div>
              </div>
            ))}
            {(!rotation || rotation.length === 0) && (
              <div className="text-xs text-muted">Loading live rotation data...</div>
            )}
          </div>
        </div>

        {/* Clusters - Real correlation */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Correlation</span>
          <div className="text-xs lg:text-sm text-secondary font-bold tracking-tight uppercase">
            {correlation ? `STRESS: ${(correlation.stress_index * 100).toFixed(0)}%` : 'Computing...'}
          </div>
          <div className="w-full h-1 bg-white/5 mt-3 overflow-hidden rounded-full">
            <div
              className={`h-full transition-all duration-1000 opacity-60 ${correlation && correlation.stress_index > 0.7 ? 'bg-red-400' : 'bg-green-400'}`}
              style={{ width: `${((correlation?.stress_index || 0.1) * 100)}%` }}
            ></div>
          </div>
          {correlation && correlation.cluster_a && correlation.cluster_a.length > 0 && (
            <div className="text-[10px] text-muted font-mono-data mt-1">
              A: {correlation.cluster_a.join(', ')}
            </div>
          )}
        </div>

        {/* Anomaly */}
        <div className={`p-5 lg:p-6 flex flex-col justify-between transition-all duration-1000 ease-[var(--easing)] ${state.uncertainty === 'CRITICAL' ? 'bg-red-950/20' : 'bg-void'} min-h-[100px]`}>
          <span className="text-xs font-bold text-muted uppercase tracking-[0.3em]">Anomaly</span>
          <div className="flex justify-between items-center">
            <span className={`text-xs lg:text-sm font-bold uppercase tracking-tight ${state.uncertainty === 'CRITICAL' ? 'text-red-500' : state.uncertainty === 'HIGH' ? 'text-yellow-400' : 'text-muted'}`}>{state.uncertainty} RISK</span>
            <div className={`w-2 h-2 rounded-full ${state.uncertainty === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_red]' : state.uncertainty === 'HIGH' ? 'bg-yellow-400' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPanel;
