import React from 'react';
import { GovernanceMode, ExecutionLog, SystemMetrics } from '../types';

interface GovernanceSidebarProps {
  healthScore: number;
  mode: GovernanceMode;
  logs: ExecutionLog[];
  metrics: SystemMetrics;
}

const GovernanceSidebar: React.FC<GovernanceSidebarProps> = ({ healthScore, mode, logs, metrics }) => {
  const getHealthColor = (score: number): string => {
    if (score > 80) return 'stroke-green-400';
    if (score > 60) return 'stroke-yellow-400';
    if (score > 40) return 'stroke-orange-400';
    return 'stroke-red-500';
  };

  const getHealthGlow = (score: number): string => {
    if (score > 80) return 'drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]';
    if (score > 60) return 'drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]';
    if (score > 40) return 'drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]';
    return 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-muted">Risk Audit</h2>
        <span className="text-[10px] text-muted font-mono-data font-bold opacity-40">LIVE</span>
      </div>

      {/* High-Precision Health Gauge Card */}
      <div className="terminal-panel flex-1 p-8 lg:p-10 rounded-sm flex flex-col items-center justify-between border border-white/5 bg-ink/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-20 pointer-events-none"></div>

        {/* Main Gauge */}
        <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex items-center justify-center my-6">
          <svg className={`w-full h-full transform -rotate-90 ${getHealthGlow(healthScore)}`} viewBox="0 0 100 100">
            {/* Background Track */}
            <circle cx="50" cy="50" r="45" stroke="var(--border)" strokeWidth="1.5" fill="transparent" opacity="0.1" />

            {/* Progress Arc */}
            <circle
              cx="50" cy="50" r="45" strokeWidth="3" fill="transparent"
              strokeDasharray="282.7"
              strokeDashoffset={`${282.7 * (1 - healthScore / 100)}`}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-[var(--easing)] ${getHealthColor(healthScore)}`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-none drop-shadow-md">{healthScore}</span>
            <span className="text-[10px] lg:text-xs text-muted font-bold uppercase tracking-[0.4em] mt-4 opacity-60">Health Idx</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full space-y-6 lg:space-y-8 mt-auto">
          <div className="group">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-[0.3em] opacity-60">Protocol</span>
              <span className={`text-sm lg:text-base font-bold uppercase tracking-widest ${
                mode === 'FULL' ? 'text-green-400' :
                mode === 'REDUCED' ? 'text-yellow-400' :
                mode === 'DEFENSIVE' ? 'text-orange-400' :
                'text-red-400'
              }`}>{mode}</span>
            </div>
            <div className="h-px w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
          </div>

          <div className="group">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-[0.3em] opacity-60">Drawdown</span>
              <span className={`text-sm lg:text-base font-bold font-mono-data tracking-widest ${metrics.drawdown > 5 ? 'text-red-400' : 'text-white'}`}>
                -{metrics.drawdown.toFixed(2)}%
              </span>
            </div>
            <div className="h-px w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
          </div>

          {(metrics.total_pnl !== undefined || metrics.sharpe_ratio !== undefined) && (
            <div className="group">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-xs font-bold text-muted uppercase tracking-[0.3em] opacity-60">Total PnL</span>
                <span className={`text-sm lg:text-base font-bold font-mono-data tracking-widest ${
                  (metrics.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${(metrics.total_pnl || 0).toFixed(2)}
                </span>
              </div>
              <div className="h-px w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
            </div>
          )}

          {metrics.win_rate !== undefined && metrics.win_rate > 0 && (
            <div className="group">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-xs font-bold text-muted uppercase tracking-[0.3em] opacity-60">Win Rate</span>
                <span className={`text-sm lg:text-base font-bold font-mono-data tracking-widest ${
                  metrics.win_rate >= 0.5 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(metrics.win_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-px w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
            </div>
          )}

          <div className="group">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-[0.3em] opacity-60">Exposure</span>
              <span className="text-sm lg:text-base font-bold text-white font-mono-data tracking-widest">
                {metrics.exposure.toFixed(1)}%
              </span>
            </div>
            <div className="h-px w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceSidebar;
