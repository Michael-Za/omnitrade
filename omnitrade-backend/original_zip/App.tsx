import React, { useState, useEffect, useCallback } from 'react';
import { 
  View,
  ScannerState, 
  MarketPhase, 
  TrendState, 
  ClockSession, 
  GovernanceMode, 
  ExecutionLog, 
  BotConfig,
  SystemMetrics,
} from './types';
import { TRADING_BOTS } from './constants';
import ScannerPanel from './components/ScannerPanel';
import BotCard from './components/BotCard';
import GovernanceSidebar from './components/GovernanceSidebar';
import { getMarketAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [scannerState, setScannerState] = useState<ScannerState>({
    volatility: 'LOW',
    trend: TrendState.UP,
    phase: MarketPhase.EXP,
    clock: ClockSession.LONDON,
    cycle: 'MID',
    uncertainty: 'LOW'
  });

  const [bots, setBots] = useState<BotConfig[]>(TRADING_BOTS);
  const [healthScore, setHealthScore] = useState(98);
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>(GovernanceMode.FULL);
  const [metrics, setMetrics] = useState<SystemMetrics>({ drawdown: 0.42, correlationStress: 0.08, exposure: 12.5 });
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    { id: '1', bot: 'VWAP REVERSION', action: 'Entry Detected ETH/USDT', status: 'SUCCESS', timestamp: '16:02:11' },
    { id: '2', bot: 'LIQUIDITY SWEEP', action: 'Order Filled BTC/USDT', status: 'SUCCESS', timestamp: '15:58:44' },
    { id: '3', bot: 'MOMENTUM SCALPEL', action: 'Telemetry Check Pass', status: 'SUCCESS', timestamp: '15:55:00' },
  ]);
  
  const [aiAdvice, setAiAdvice] = useState<string>("Analyzing cross-chain liquidity metrics for institutional exposure...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme Sync - Slate Dark vs Platinum Light
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, [theme]);

  // Market Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setScannerState(prev => ({
        ...prev,
        volatility: Math.random() > 0.95 ? 'HIGH' : 'LOW',
        uncertainty: Math.random() > 0.98 ? 'CRITICAL' : (Math.random() > 0.9 ? 'HIGH' : 'LOW')
      }));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Governance Logic
  useEffect(() => {
    let score = 100 - (metrics.drawdown * 2);
    if (scannerState.uncertainty === 'HIGH') score -= 10;
    if (scannerState.uncertainty === 'CRITICAL') score -= 80;
    const finalScore = Math.max(0, Math.floor(score));
    setHealthScore(finalScore);
    
    if (finalScore >= 90) setGovernanceMode(GovernanceMode.FULL);
    else if (finalScore >= 70) setGovernanceMode(GovernanceMode.REDUCED);
    else setGovernanceMode(GovernanceMode.STOP);
  }, [scannerState.uncertainty, metrics.drawdown]);

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const navItems = [
    { id: View.DASHBOARD, label: 'CMD', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
    { id: View.BOTS, label: 'FLEET', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> },
    { id: View.INTELLIGENCE, label: 'INTEL', icon: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/> },
    { id: View.GOVERNANCE, label: 'AUDIT', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
    { id: View.LABS, label: 'LABS', icon: <><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></> },
  ];

  const fetchAdvice = useCallback(async () => {
    setIsAiLoading(true);
    const advice = await getMarketAdvice(scannerState);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [scannerState]);

  useEffect(() => {
    fetchAdvice();
  }, [scannerState.phase, scannerState.uncertainty, fetchAdvice]);

  const renderViewHeader = (title: string, subtitle: string) => (
    <div className="mb-8 lg:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-6 lg:pb-8">
      <div className="space-y-1 lg:space-y-2">
        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-primary uppercase leading-none">{title}</h2>
        <p className="text-muted font-bold text-[8px] lg:text-[9px] uppercase tracking-[0.4em]">{subtitle}</p>
      </div>
      <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end gap-4">
         <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-60 hidden sm:block">Protocol Sync</span>
            <span className="text-[10px] lg:text-xs font-mono-data font-bold text-secondary uppercase tracking-widest">Active</span>
         </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case View.BOTS:
        return (
          <div className="page-enter">
            {renderViewHeader("Fleet Management", "Deployment grid for institutional execution modules.")}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-neutral-900/10 border border-white/5 rounded-sm overflow-hidden">
              {bots.map(bot => <BotCard key={bot.id} bot={bot} onToggle={toggleBot} />)}
            </div>
          </div>
        );
      case View.LABS:
        return (
          <div className="page-enter flex flex-col items-center pt-4 lg:pt-10">
             <div className="w-full max-w-4xl terminal-panel p-6 lg:p-10 rounded-sm border-l-2 border-accent bg-ink">
                <div className="mb-6 lg:mb-10 flex items-center gap-6">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]"></div>
                   <h3 className="text-lg lg:text-xl font-bold tracking-tight uppercase text-primary">Neural Oracle v9.4</h3>
                </div>
                <div className="bg-void p-6 lg:p-10 rounded-sm font-mono-data text-xs lg:text-sm text-secondary border border-white/5 min-h-[200px] lg:min-h-[300px] leading-relaxed shadow-inner">
                   <span className="text-muted mr-2 font-black">SYS_LOG ></span> {aiAdvice}
                </div>
                <div className="mt-6 lg:mt-10 flex flex-col sm:flex-row gap-4">
                   <input type="text" placeholder="ENTER QUERY PARAMETERS..." className="flex-1 bg-void border border-white/10 px-6 py-4 text-xs font-mono-data text-primary focus:outline-none focus:border-accent transition-all uppercase tracking-widest" />
                   <button onClick={fetchAdvice} className="px-10 py-4 bg-accent text-void text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-300 active:scale-95">Execute</button>
                </div>
             </div>
          </div>
        );
      default:
        return (
          <div className="page-enter flex flex-col gap-8 lg:gap-10">
             <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 lg:gap-10">
                <div className="xl:col-span-3 space-y-10 lg:space-y-12">
                  <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink border-l-2 border-accent">
                    <div className="flex justify-between items-center mb-4 lg:mb-6">
                       <span className="text-[9px] font-bold text-muted uppercase tracking-[0.5em]">Tactical Strategy Hub</span>
                       <span className="text-[8px] text-muted font-mono-data">LATENCY: 1ms</span>
                    </div>
                    <p className="text-lg lg:text-xl text-primary font-bold tracking-tight leading-snug italic max-w-4xl">"{aiAdvice}"</p>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                       <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.5em]">Active Modules</h3>
                       <button onClick={() => setCurrentView(View.BOTS)} className="text-[9px] font-bold text-muted hover:text-accent uppercase transition-all tracking-[0.3em]">All Fleet →</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-900/10 border border-white/5 rounded-sm overflow-hidden">
                      {bots.slice(0, 3).map(bot => <BotCard key={bot.id} bot={bot} onToggle={toggleBot} />)}
                    </div>
                  </div>

                  <ScannerPanel state={scannerState} />
                </div>
                <div className="xl:col-span-1">
                   <GovernanceSidebar healthScore={healthScore} mode={governanceMode} logs={executionLogs} metrics={metrics} />
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-void text-secondary overflow-hidden font-sans selection:bg-accent selection:text-void transition-colors duration-500">
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex w-24 h-full border-r border-white/5 flex-col items-center py-12 gap-16 bg-ink z-50">
        <div 
          onClick={() => setCurrentView(View.DASHBOARD)}
          className="w-14 h-14 flex items-center justify-center cursor-pointer group"
        >
           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent group-hover:scale-110 transition-all duration-700 ease-[var(--easing)]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <nav className="flex flex-col gap-8">
           {navItems.map(item => (
             <button 
                key={item.id} 
                onClick={() => setCurrentView(item.id)}
                className={`w-14 h-14 flex flex-col items-center justify-center transition-all duration-700 group relative ${currentView === item.id ? 'text-accent' : 'text-muted hover:text-secondary'}`}
             >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500">{item.icon}</svg>
                <span className="mt-3 text-[8px] font-black tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-500 uppercase">{item.label}</span>
                {currentView === item.id && <div className="absolute -right-5 w-1 h-8 bg-accent rounded-full shadow-[0_0_15px_var(--accent)]"></div>}
             </button>
           ))}
        </nav>
      </aside>

      {/* VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 lg:h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-16 bg-void z-40 transition-colors duration-500">
           <div className="flex items-center gap-4 lg:gap-10">
              <span className="hidden sm:block text-[11px] font-bold text-muted uppercase tracking-[0.6em] opacity-60">OMNI</span>
              <div className="hidden sm:block w-[1px] h-6 lg:h-8 bg-white/10"></div>
              <h1 className="text-[10px] lg:text-xs font-bold text-primary uppercase tracking-[0.2em] lg:tracking-[0.3em] flex items-center gap-2 lg:gap-4">
                {navItems.find(n => n.id === currentView)?.label} <span className="hidden lg:inline text-muted opacity-50">NODE</span>
                <span className="text-[8px] lg:text-[9px] px-2 py-0.5 border border-white/10 text-muted font-bold tracking-widest rounded-full uppercase">Secured</span>
              </h1>
           </div>
           
           <div className="flex items-center gap-4 lg:gap-10">
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">Time</span>
                 <span className="text-[11px] font-mono-data font-bold text-secondary">{currentTime}</span>
              </div>
              
              <div className="hidden md:block w-[1px] h-6 lg:h-8 bg-white/10"></div>
              
              {/* THEME TOGGLE */}
              <button 
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="group flex items-center gap-2 lg:gap-4 px-3 py-1.5 lg:px-4 lg:py-2 rounded-sm border border-white/10 hover:border-accent/40 transition-all duration-500"
              >
                 <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">Mode</span>
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                 </div>
                 <div className="w-8 h-4 lg:w-10 lg:h-5 bg-void border border-white/10 rounded-full relative p-0.5 lg:p-1 transition-all">
                    <div className={`w-2.5 h-2.5 lg:w-3 lg:h-3 bg-accent rounded-full transition-all duration-700 ease-[var(--easing)] ${theme === 'light' ? 'ml-4 lg:ml-5 shadow-[0_0_8px_var(--accent)]' : 'ml-0'}`}></div>
                 </div>
              </button>

              <div className="hidden md:block w-[1px] h-6 lg:h-8 bg-white/10"></div>

              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60 hidden sm:block">Auth</span>
                 <span className="text-[10px] lg:text-11px font-mono-data font-bold text-secondary opacity-80">0x...F7E2</span>
              </div>
           </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-16 custom-scrollbar transition-colors duration-500">
           {renderContent()}
           <div className="h-20 lg:hidden"></div> {/* Bottom nav space */}
        </section>

        <footer className="hidden lg:flex h-16 border-t border-white/5 bg-void items-center px-16 justify-between z-40 transition-colors duration-500">
           <div className="flex gap-12 items-center">
              <span className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-[0.4em]">
                 <span className="status-dot bg-accent animate-subtle-pulse shadow-[0_0_8px_var(--accent)]"></span> Terminal Secured
              </span>
              <span className="text-[10px] text-muted font-mono-data font-bold tracking-widest">GS_VAL: 104.22</span>
           </div>
           <div className="text-[9px] text-muted font-mono-data font-bold uppercase tracking-[0.5em] opacity-40">
             OMNITRADE_OS_4.2.0_ULTRA
           </div>
        </footer>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-ink border-t border-white/5 flex items-center justify-around px-4 z-50">
           {navItems.map(item => (
             <button 
                key={item.id} 
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 transition-all duration-500 ${currentView === item.id ? 'text-accent' : 'text-muted'}`}
             >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
             </button>
           ))}
        </nav>
      </main>
    </div>
  );
};

export default App;