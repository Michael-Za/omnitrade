'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { omnitradeApi } from '@/lib/api/omnitrade';
import { vibeTradingApi } from '@/lib/api/vibe-trading';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TradingBotsView } from '@/components/trading-bots/trading-bots-view';
import { AIAgentView } from '@/components/ai-agent/ai-agent-view';
import { MemeCoinsView } from '@/components/meme-coins/meme-coins-view';
import { StocksView } from '@/components/stocks/stocks-view';
import { BacktestView } from '@/components/backtest/backtest-view';
import { ShadowAccountView } from '@/components/shadow-account/shadow-account-view';
import { SettingsView } from '@/components/settings/settings-view';

const VIEW_MAP: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  bots: TradingBotsView,
  'ai-agent': AIAgentView,
  'meme-coins': MemeCoinsView,
  stocks: StocksView,
  backtest: BacktestView,
  'shadow-account': ShadowAccountView,
  settings: SettingsView,
};

export default function HomePage() {
  const { activeView, setWsData, setOmnitradeStatus, setVibeTradingStatus } = useAppStore();

  // Connect to Omnitrade WebSocket on mount
  useEffect(() => {
    const unsubData = omnitradeApi.onWSMessage((data) => {
      setWsData(data);
    });
    const unsubStatus = omnitradeApi.onWSStatusChange((status) => {
      setOmnitradeStatus(status);
    });
    omnitradeApi.connectWS();

    // Check Vibe-Trading health periodically
    const checkVibe = async () => {
      const health = await vibeTradingApi.checkHealth();
      setVibeTradingStatus(health.status === 'ok' ? 'connected' : 'disconnected');
    };
    checkVibe();
    const vibeInterval = setInterval(checkVibe, 30000);

    return () => {
      unsubData();
      unsubStatus();
      omnitradeApi.disconnectWS();
      clearInterval(vibeInterval);
    };
  }, [setWsData, setOmnitradeStatus, setVibeTradingStatus]);

  const ActiveView = VIEW_MAP[activeView] || DashboardView;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <ActiveView />
      </main>
    </div>
  );
}
