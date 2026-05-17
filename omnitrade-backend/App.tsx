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
  TickerPrice,
  TokenRotation,
  CorrelationData,
} from './types';
import { TRADING_BOTS, CRYPTO_TICKER_SYMBOLS, STOCK_TICKER_SYMBOLS } from './constants';
import ScannerPanel from './components/ScannerPanel';
import BotCard from './components/BotCard';
import GovernanceSidebar from './components/GovernanceSidebar';
import PriceTicker from './components/PriceTicker';
import MemeCoinPanel from './components/MemeCoinPanel';
import { getMarketAdvice } from './services/geminiService';
import { backendService, BackendData } from './services/backendService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [scannerState, setScannerState] = useState<ScannerState>({
    volatility: 'LOW',
    trend: TrendState.NEUTRAL,
    phase: MarketPhase.ACC,
    clock: ClockSession.LONDON,
    cycle: 'MID',
    uncertainty: 'LOW'
  });

  const [bots, setBots] = useState<BotConfig[]>(TRADING_BOTS);
  const [healthScore, setHealthScore] = useState(100);
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>(GovernanceMode.FULL);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    drawdown: 0,
    correlationStress: 0,
    exposure: 0,
    total_pnl: 0,
    win_rate: 0,
    sharpe_ratio: 0,
    max_drawdown: 0,
    open_positions: 0,
  });
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);

  // Real data state
  const [prices, setPrices] = useState<Record<string, TickerPrice>>({});
  const [rotation, setRotation] = useState<TokenRotation[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [dataSource, setDataSource] = useState<'LIVE' | 'MOCK'>('MOCK');

  const [aiAdvice, setAiAdvice] = useState<string>("Connecting to live market data...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme Sync
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

  // Backend Integration - REAL DATA via WebSocket
  useEffect(() => {
    backendService.connect();
    const unsubscribe = backendService.subscribe((data: BackendData) => {
      setBackendConnected(true);
      setDataSource(data.data_source || 'MOCK');

      // Update scanner state from real data
      setScannerState({
        volatility: data.scanners.volatility,
        trend: data.scanners.trend as TrendState,
        phase: data.scanners.phase as MarketPhase,
        clock: data.scanners.clock as ClockSession,
        cycle: data.scanners.cycle as 'EARLY' | 'MID' | 'LATE',
        uncertainty: data.scanners.uncertainty as 'LOW' | 'HIGH' | 'CRITICAL',
        rotation: data.scanners.rotation,
        correlation: data.scanners.correlation,
      });

      setBots(data.bots);
      setHealthScore(data.health);
      setGovernanceMode(data.mode as GovernanceMode);
      setMetrics(data.metrics);
      setExecutionLogs(data.logs);
      setPrices(data.prices || {});
      setRotation(data.scanners.rotation || []);
      setCorrelation(data.scanners.correlation || null);
    });
    return () => unsubscribe();
  }, []);

  const toggleBot = async (id: string) => {
    const result = await backendService.toggleBot(id);
    if (result) {
      setBots(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    }
  };

  const initializeBot = async (id: string) => {
    try {
      await backendService.initializeBot(id);
    } catch (e) {
      console.error("Failed to initialize bot", e);
    }
  };

  const navItems = [
    { id: View.DASHBOARD, label: 'CMD', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
    { id: View.BOTS, label: 'FLEET', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
    { id: View.INTELLIGENCE, label: 'INTEL', icon: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
    { id: View.GOVERNANCE, label: 'AUDIT', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    { id: View.LABS, label: 'LABS', icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></> },
  ];

  const fetchAdvice = useCallback(async () => {
    setIsAiLoading(true);
    const advice = await getMarketAdvice(scannerState);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [scannerState]);

  useEffect(() => {
    if (backendConnected) {
      fetchAdvice();
    }
  }, [scannerState.phase, scannerState.uncertainty, fetchAdvice, backendConnected]);

  // Format price for display
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const renderViewHeader = (title: string, subtitle: string) => (
    <div className="mb-10 lg:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-8 lg:pb-10">
      <div className="space-y-2 lg:space-y-4">
        <h2 className="text-4xl lg:text-7xl font-bold tracking-tighter text-primary uppercase leading-none">{title}</h2>
        <p className="text-muted font-bold text-xs lg:text-sm uppercase tracking-[0.5em]">{subtitle}</p>
      </div>
      <div className="mt-6 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end gap-6">
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-muted uppercase tracking-widest opacity-60 hidden sm:block">Data Source</span>
          <span className={`text-sm lg:text-base font-mono-data font-bold uppercase tracking-widest ${dataSource === 'LIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
            {dataSource}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-muted uppercase tracking-widest opacity-60 hidden sm:block">Protocol Sync</span>
          <span className={`text-sm lg:text-base font-mono-data font-bold uppercase tracking-widest ${backendConnected ? 'text-green-400' : 'text-red-400'}`}>
            {backendConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case View.BOTS:
        return (
          <div className="page-enter">
            {renderViewHeader("Fleet Management", "Real-time bot deployment based on live market signals")}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-neutral-900/10 border border-white/5 rounded-sm overflow-hidden">
              {bots.map(bot => <BotCard key={bot.id} bot={bot} onToggle={toggleBot} onInitialize={initializeBot} />)}
            </div>
          </div>
        );
      case View.LABS:
        return (
          <div className="page-enter">
            {renderViewHeader("Labs", "Neural analysis powered by real market data")}
            <div className="w-full max-w-4xl terminal-panel p-6 lg:p-10 rounded-sm border-l-2 border-accent bg-ink">
              <div className="mb-6 lg:mb-10 flex items-center gap-6">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]"></div>
                <h3 className="text-lg lg:text-xl font-bold tracking-tight uppercase text-primary">Neural Oracle v9.4</h3>
                <span className={`text-xs font-mono-data font-bold ${dataSource === 'LIVE' ? 'text-green-400' : 'text-yellow-400'}`}>{dataSource}</span>
              </div>
              <div className="bg-void p-8 lg:p-12 rounded-sm font-mono-data text-sm lg:text-base text-secondary border border-white/5 min-h-[200px] lg:min-h-[300px] leading-relaxed shadow-inner">
                <span className="text-muted mr-3 font-black">SYS_LOG &gt;</span> {aiAdvice}
              </div>
              <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row gap-6">
                <input type="text" placeholder="ENTER QUERY PARAMETERS..." className="flex-1 bg-void border border-white/10 px-6 py-5 text-sm font-mono-data text-primary focus:outline-none focus:border-accent transition-all uppercase tracking-widest" />
                <button onClick={fetchAdvice} className="px-12 py-5 bg-accent text-void text-xs font-bold uppercase tracking-[0.4em] transition-all duration-300 active:scale-95">Execute</button>
              </div>
            </div>
          </div>
        );
      case View.INTELLIGENCE:
        return (
          <div className="page-enter">
            {renderViewHeader("Intelligence", "Live market data, meme coin analysis, and sentiment feeds")}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
              {/* Live Price Grid */}
              <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink border-l-2 border-accent">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Live Crypto Prices</span>
                  <span className="text-xs font-mono-data text-green-400 font-bold">{dataSource}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(prices).length === 0 ? (
                    <div className="text-sm text-muted py-4">Connecting to live data feed...</div>
                  ) : (
                    Object.entries(prices).slice(0, 12).map(([symbol, data]) => (
                      <div key={symbol} className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 transition-all">
                        <span className="text-sm font-bold text-primary tracking-wider">{symbol.replace('/USDT', '')}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono-data text-secondary font-bold">${formatPrice(data.price)}</span>
                          <span className={`text-xs font-mono-data font-bold ${data.change_pct_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatChange(data.change_pct_24h)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Meme Coin Analysis */}
              <MemeCoinPanel />
            </div>
          </div>
        );
      case View.GOVERNANCE:
        return (
          <div className="page-enter">
            {renderViewHeader("Governance", "Real-time risk management and system health monitoring")}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
              <GovernanceSidebar healthScore={healthScore} mode={governanceMode} logs={executionLogs} metrics={metrics} />

              {/* Execution Log */}
              <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Execution Feed</span>
                  <span className="text-xs font-mono-data text-muted">{executionLogs.length} events</span>
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {executionLogs.length === 0 ? (
                    <div className="text-sm text-muted py-8 text-center">No executions yet. Waiting for market signals...</div>
                  ) : (
                    executionLogs.slice(0, 20).map(log => (
                      <div key={log.id} className="flex justify-between items-center py-2 px-3 border-b border-white/5 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-400' : log.status === 'WARNING' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                          <span className="text-xs font-bold text-primary">{log.bot}</span>
                          {log.symbol && <span className="text-xs text-muted">{log.symbol}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-secondary">{log.action}</span>
                          <span className="text-xs font-mono-data text-muted">{log.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="page-enter flex flex-col gap-8 lg:gap-10">
            {/* Live Price Ticker Bar */}
            <PriceTicker prices={prices} />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 lg:gap-10">
              <div className="xl:col-span-3 space-y-10 lg:space-y-12">
                <div className="terminal-panel p-6 lg:p-8 rounded-sm bg-ink border-l-2 border-accent">
                  <div className="flex justify-between items-center mb-6 lg:mb-8">
                    <span className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Tactical Strategy Hub</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-mono-data font-bold ${dataSource === 'LIVE' ? 'text-green-400' : 'text-yellow-400'}`}>{dataSource}</span>
                      <span className="text-xs text-muted font-mono-data">{backendConnected ? 'CONNECTED' : 'OFFLINE'}</span>
                    </div>
                  </div>
                  <p className="text-lg lg:text-xl text-primary font-bold tracking-tight leading-snug italic max-w-4xl">"{aiAdvice}"</p>
                </div>

                <div className="space-y-4 lg:space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-[0.5em]">Active Modules</h3>
                    <button onClick={() => setCurrentView(View.BOTS)} className="text-xs font-bold text-muted hover:text-accent uppercase transition-all tracking-[0.3em]">All Fleet →</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-900/10 border border-white/5 rounded-sm overflow-hidden">
                    {bots.slice(0, 3).map(bot => <BotCard key={bot.id} bot={bot} onToggle={toggleBot} onInitialize={initializeBot} />)}
                  </div>
                </div>

                <ScannerPanel state={scannerState} rotation={rotation} correlation={correlation} />
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent group-hover:scale-110 transition-all duration-700 ease-[var(--easing)]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
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
          <div className="flex items-center gap-6 lg:gap-12">
            <span className="hidden sm:block text-xs font-bold text-muted uppercase tracking-[0.6em] opacity-60">OMNI</span>
            <div className="hidden sm:block w-[1px] h-8 lg:h-10 bg-white/10"></div>
            <h1 className="text-xs lg:text-sm font-bold text-primary uppercase tracking-[0.3em] lg:tracking-[0.4em] flex items-center gap-3 lg:gap-6">
              {navItems.find(n => n.id === currentView)?.label} <span className="hidden lg:inline text-muted opacity-50">NODE</span>
              <span className={`text-xs lg:text-sm px-3 py-1 border font-bold tracking-widest rounded-full uppercase ${dataSource === 'LIVE' ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                {dataSource}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-6 lg:gap-12">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-muted uppercase tracking-widest opacity-60">Time</span>
              <span className="text-sm font-mono-data font-bold text-secondary">{currentTime}</span>
            </div>

            <div className="hidden md:block w-[1px] h-8 lg:h-10 bg-white/10"></div>

            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="group flex items-center gap-3 lg:gap-6 px-4 py-2 lg:px-6 lg:py-3 rounded-sm border border-white/10 hover:border-accent/40 transition-all duration-500"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-muted uppercase tracking-widest opacity-60">Mode</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </div>
              <div className="w-10 h-5 lg:w-12 lg:h-6 bg-void border border-white/10 rounded-full relative p-1 lg:p-1.5 transition-all">
                <div className={`w-3 h-3 lg:w-3.5 lg:h-3.5 bg-accent rounded-full transition-all duration-700 ease-[var(--easing)] ${theme === 'light' ? 'ml-5 lg:ml-6 shadow-[0_0_10px_var(--accent)]' : 'ml-0'}`}></div>
              </div>
            </button>

            <div className="hidden md:block w-[1px] h-8 lg:h-10 bg-white/10"></div>

            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-muted uppercase tracking-widest opacity-60 hidden sm:block">Auth</span>
              <span className="text-xs lg:text-sm font-mono-data font-bold text-secondary opacity-80">0x...F7E2</span>
            </div>

            <div className="hidden md:block w-[1px] h-8 lg:h-10 bg-white/10"></div>

            <button onClick={() => setIsSettingsOpen(true)} className="group hover:text-accent transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </header>

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-ink border border-white/10 p-8 rounded-sm w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary">System Config</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest">Google Sheet ID (Optional)</label>
                  <input
                    type="text"
                    value={googleSheetId}
                    onChange={e => setGoogleSheetId(e.target.value)}
                    className="w-full bg-void border border-white/10 p-3 text-sm font-mono-data text-secondary focus:border-accent outline-none"
                    placeholder="SPREADSHEET_ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest">Service Account JSON (Optional)</label>
                  <textarea
                    value={serviceAccountJson}
                    onChange={e => setServiceAccountJson(e.target.value)}
                    className="w-full bg-void border border-white/10 p-3 text-sm font-mono-data text-secondary focus:border-accent outline-none h-32"
                    placeholder="{ ... }"
                  />
                </div>

                <div className="space-y-2 p-4 bg-void border border-white/5">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">Data Sources (Auto-configured)</span>
                  <div className="text-xs font-mono-data text-secondary space-y-1">
                    <div className="flex justify-between"><span>Crypto</span><span className="text-green-400">Binance (CCXT)</span></div>
                    <div className="flex justify-between"><span>Stocks</span><span className="text-green-400">Yahoo Finance</span></div>
                    <div className="flex justify-between"><span>Sentiment</span><span className="text-green-400">CoinGecko + Reddit</span></div>
                    <div className="flex justify-between"><span>Meme Coins</span><span className="text-green-400">DexScreener</span></div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-primary">Cancel</button>
                  <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-3 bg-accent text-void text-xs font-bold uppercase tracking-widest hover:bg-accent/90">Save Config</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="flex-1 overflow-y-auto p-6 lg:p-16 custom-scrollbar transition-colors duration-500">
          {renderContent()}
          <div className="h-20 lg:hidden"></div>
        </section>

        <footer className="hidden lg:flex h-16 border-t border-white/5 bg-void items-center px-16 justify-between z-40 transition-colors duration-500">
          <div className="flex gap-12 items-center">
            <span className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-[0.4em]">
              <span className={`status-dot ${backendConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'} animate-subtle-pulse`}></span>
              {backendConnected ? 'Terminal Live' : 'Reconnecting...'}
            </span>
            <span className="text-[10px] text-muted font-mono-data font-bold tracking-widest">
              DATA: {dataSource}
            </span>
            {Object.keys(prices).length > 0 && (
              <span className="text-[10px] text-muted font-mono-data font-bold tracking-widest">
                BTC: ${formatPrice(prices['BTC/USDT']?.price || 0)}
              </span>
            )}
          </div>
          <div className="text-[9px] text-muted font-mono-data font-bold uppercase tracking-[0.5em] opacity-40">
            OMNITRADE_OS_5.0.0_LIVE
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
