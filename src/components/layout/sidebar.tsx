'use client';

import { useAppStore } from '@/stores/app-store';
import type { ViewId } from '@/lib/api/types';
import {
  LayoutDashboard,
  Bot,
  Brain,
  Coins,
  TrendingUp,
  FlaskConical,
  Ghost,
  Settings,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bots', label: 'Trading Bots', icon: Bot },
  { id: 'ai-agent', label: 'AI Agent', icon: Brain },
  { id: 'meme-coins', label: 'Meme Coins', icon: Coins },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp },
  { id: 'backtest', label: 'Backtest', icon: FlaskConical },
  { id: 'shadow-account', label: 'Shadow Account', icon: Ghost },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, omnitradeStatus, vibeTradingStatus, theme, toggleTheme } = useAppStore();

  const isOmniLive = omnitradeStatus === 'connected';
  const isVibeLive = vibeTradingStatus === 'connected';

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">OT</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-sidebar-foreground font-semibold text-sm tracking-wide truncate">
                Omnitrade
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const btn = (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-sidebar-foreground/70',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-2 space-y-2">
          {/* Connection Status */}
          <div className={cn('flex items-center gap-2 px-3 py-2', sidebarCollapsed && 'justify-center px-0')}>
            <div className="flex items-center gap-1.5">
              {isOmniLive ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
              )}
              {!sidebarCollapsed && (
                <span className={cn('text-xs', isOmniLive ? 'text-emerald-400' : 'text-red-400')}>
                  {isOmniLive ? 'LIVE' : 'OFFLINE'}
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 ml-auto">
                {isVibeLive ? (
                  <Brain className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Collapse Toggle */}
          <div className={cn('flex items-center', sidebarCollapsed && 'justify-center')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {sidebarCollapsed ? 'Expand' : 'Collapse'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
