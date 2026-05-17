import React from 'react';
import { GovernanceMode, ExecutionLog, SystemMetrics } from '../types';

interface GovernanceSidebarProps {
  healthScore: number;
  mode: GovernanceMode;
  logs: ExecutionLog[];
  metrics: SystemMetrics;
}

const GovernanceSidebar: React.FC<GovernanceSidebarProps> = ({ healthScore, mode, logs, metrics }) => {
  return (
    <div className="flex flex-col gap-8 lg:gap-10 w-full h-full">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-secondary opacity-60">Risk Audit</h2>
        <span className="text-[9px] text-secondary font-mono-data font-bold opacity-40">V_4.2.X</span>
      </div>

      {/* High-Precision Health Gauge */}
      <div className="terminal-panel p-8 lg:p-12 rounded-sm flex flex-col items-center relative overflow-hidden">
        {/* Subtle background glow for the panel based on health */}
        <div
          className="absolute inset-0 bg-accent/5 blur-3xl rounded-full transform translate-y-1/2 opacity-20 pointer-events-none"
          style={{ opacity: healthScore > 80 ? 0.2 : 0.05 }}
        />

        <div className="relative w-40 h-40 lg:w-52 lg:h-52 flex items-center justify-center">
          {/* Complex SVG Gauge */}
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
            <defs>
              <linearGradient id="healthGradient" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer decorative ring */}
            <circle cx="50" cy="50" r="48" stroke="var(--border)" strokeWidth="0.5" fill="none" opacity="0.5" strokeDasharray="4 2" />

            {/* Track Background */}
            <circle cx="50" cy="50" r="42" stroke="var(--text-secondary)" strokeWidth="6" fill="none" className="opacity-10" />

            {/* Progress Arc */}
            <circle
              cx="50" cy="50" r="42"
              stroke="url(#healthGradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray="263.89" /* 2 * pi * 42 */
              strokeDashoffset={263.89 - (263.89 * healthScore) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ filter: 'drop-shadow(0 0 3px var(--accent))' }}
            />

            {/* Inner decorative ring */}
            <circle cx="50" cy="50" r="34" stroke="var(--border)" strokeWidth="0.5" fill="none" opacity="0.3" />
          </svg>

          {/* Centered Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="relative">
              <span className="text-5xl lg:text-7xl font-bold tracking-tighter text-accent leading-none drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">
                {healthScore}
              </span>
              <div className="absolute -top-2 -right-3 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <span className="text-[9px] lg:text-[10px] text-secondary font-bold uppercase tracking-[0.4em] mt-3 lg:mt-4 opacity-80">
              Health Idx
            </span>
          </div>
        </div>

        <div className="w-full mt-8 lg:mt-12 space-y-4 lg:space-y-5">
          <div className="flex justify-between items-center py-2 lg:py-3 border-b border-white/5">
            <span className="text-[9px] lg:text-[10px] font-bold text-muted uppercase tracking-[0.4em]">Protocol</span>
            <span className="text-[10px] lg:text-[11px] font-bold uppercase text-primary">{mode}</span>
          </div>
          <div className="flex justify-between items-center py-2 lg:py-3 border-b border-white/5">
            <span className="text-[9px] lg:text-[10px] font-bold text-muted uppercase tracking-[0.4em]">Drawdown</span>
            <span className="text-[10px] lg:text-[11px] font-bold text-primary font-mono-data">-{metrics.drawdown.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Minimalist Audit Log */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-[300px]">
        <div className="flex justify-between items-center mb-4 lg:mb-6 px-1 border-b border-white/5 pb-2">
          <span className="text-[9px] font-bold text-muted uppercase tracking-[0.4em]">Telemetry Audit</span>
          <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-20"></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-px custom-scrollbar">
          {logs.map(log => (
            <div key={log.id} className="p-3 lg:p-4 border-b border-white/5 hover:bg-neutral-900/10 transition-all duration-700 group">
              <div className="flex justify-between items-center mb-1 lg:mb-2">
                <span className="text-[9px] lg:text-[10px] font-bold text-secondary tracking-tighter uppercase">{log.bot}</span>
                <span className="text-[8px] text-muted font-mono-data font-bold">{log.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className={`w-1 h-1 rounded-full ${log.status === 'SUCCESS' ? 'bg-accent opacity-50' : 'bg-red-500'}`}></div>
                <span className="text-[9px] lg:text-[10px] text-muted font-bold tracking-tight uppercase leading-none">{log.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GovernanceSidebar;