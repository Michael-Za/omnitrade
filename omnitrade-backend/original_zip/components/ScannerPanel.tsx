import React from 'react';
import { ScannerState, MarketPhase, TrendState, ClockSession } from '../types';

interface ScannerPanelProps {
  state: ScannerState;
}

const ScannerPanel: React.FC<ScannerPanelProps> = ({ state }) => {
  return (
    <div className="w-full flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">Global Intel Stream</h2>
        <div className="flex items-center gap-4 lg:gap-6">
           <span className="hidden sm:inline text-[9px] font-mono-data text-muted font-bold">STRE_LINK: OPTIMAL</span>
           <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-40"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/5 border border-white/5 rounded-sm overflow-hidden shadow-2xl">
        {/* Regime */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">Market Regime</span>
          <div>
            <div className={`text-sm font-bold mb-1 tracking-tight ${state.trend === TrendState.UP ? 'text-accent' : 'text-primary'}`}>{state.trend} MOMENTUM</div>
            <div className="text-[10px] text-muted font-mono-data uppercase font-bold tracking-widest">{state.volatility} VOL</div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">Session</span>
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-bold text-primary tracking-tight leading-none">{state.clock}</span>
            <span className="text-[10px] text-muted font-mono-data uppercase font-bold">{state.cycle}</span>
          </div>
        </div>

        {/* Alpha Strength */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">Alpha Dist.</span>
          <div className="space-y-1 lg:space-y-2">
            {['SOL', 'AVAX'].map(s => (
              <div key={s} className="flex justify-between items-center text-[10px] font-mono-data font-bold">
                <span className="text-muted uppercase">{s}</span>
                <span className="text-secondary">{(Math.random() * 8).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clusters */}
        <div className="bg-void p-5 lg:p-6 flex flex-col justify-between group hover:bg-ink transition-all duration-700 ease-[var(--easing)] min-h-[100px]">
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">Correlation</span>
          <div className="text-[10px] lg:text-xs text-secondary font-bold tracking-tight">INST_L2 : NEUTRAL</div>
          <div className="w-full h-1 bg-white/5 mt-3 overflow-hidden rounded-full">
            <div className="h-full bg-accent w-1/4 transition-all duration-1000 opacity-60"></div>
          </div>
        </div>

        {/* Anomaly */}
        <div className={`p-5 lg:p-6 flex flex-col justify-between transition-all duration-1000 ease-[var(--easing)] ${state.uncertainty === 'CRITICAL' ? 'bg-red-950/20' : 'bg-void'} min-h-[100px]`}>
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">Anomaly</span>
          <div className="flex justify-between items-center">
             <span className={`text-[11px] font-bold uppercase tracking-tight ${state.uncertainty === 'CRITICAL' ? 'text-red-500' : 'text-muted'}`}>{state.uncertainty} RISK</span>
             <div className={`w-2 h-2 rounded-full ${state.uncertainty === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-white/10'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPanel;