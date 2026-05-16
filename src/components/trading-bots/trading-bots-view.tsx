'use client';

import { useAppStore } from '@/stores/app-store';
import { omnitradeApi } from '@/lib/api/omnitrade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bot, Shield, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BotConfig, RiskLevel } from '@/lib/api/types';

const RISK_COLORS: Record<string, string> = {
  LOW: 'border-emerald-500/50 text-emerald-400',
  MED: 'border-amber-500/50 text-amber-400',
  HIGH: 'border-red-500/50 text-red-400',
};

const RISK_BG: Record<string, string> = {
  LOW: 'bg-emerald-500/10',
  MED: 'bg-amber-500/10',
  HIGH: 'bg-red-500/10',
};

function BotCard({ bot }: { bot: BotConfig }) {
  const handleToggle = async () => {
    const result = await omnitradeApi.toggleBot(bot.id);
    if (result) {
      toast.success(`${bot.name} ${result.active ? 'activated' : 'deactivated'}`);
    } else {
      toast.error(`Failed to toggle ${bot.name}`);
    }
  };

  const handleInitialize = async () => {
    const result = await omnitradeApi.initializeBot(bot.id);
    if (result) {
      toast.success(`${bot.name} initialized`);
    } else {
      toast.error(`Failed to initialize ${bot.name}`);
    }
  };

  return (
    <Card className={cn('card-glow transition-all duration-200', bot.active && 'border-primary/30')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {bot.isGuardian ? (
              <Shield className={cn('h-4 w-4', bot.active ? 'text-amber-400' : 'text-muted-foreground')} />
            ) : (
              <Bot className={cn('h-4 w-4', bot.active ? 'text-primary' : 'text-muted-foreground')} />
            )}
            <CardTitle className="text-sm font-semibold">{bot.name}</CardTitle>
          </div>
          <Switch
            checked={bot.active}
            onCheckedChange={handleToggle}
            className="scale-75"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">{bot.description}</p>

        {/* Trigger Condition */}
        <div className="p-2 rounded-md bg-muted/50 border border-border">
          <div className="text-[10px] text-muted-foreground mb-0.5">TRIGGER</div>
          <div className="text-xs font-mono font-medium">{bot.trigger}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Risk</span>
            <div>
              <Badge variant="outline" className={cn('text-[10px] px-1.5', RISK_COLORS[bot.risk])}>
                {bot.risk}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">PnL</span>
            <div className={cn('font-medium', (bot.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              ${(bot.pnl ?? 0).toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Win Rate</span>
            <div className="font-medium">{((bot.win_rate ?? 0) * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Permission Level */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Permission</span>
          <div className={cn('px-2 py-0.5 rounded text-[10px] font-medium', RISK_BG[bot.risk])}>
            {bot.isGuardian ? 'GUARDIAN' : bot.risk === 'HIGH' ? 'FULL ACCESS' : bot.risk === 'MED' ? 'LIMITED' : 'RESTRICTED'}
          </div>
        </div>

        {/* Initialize Button */}
        {!bot.active && !bot.isGuardian && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInitialize}
            className="w-full text-xs h-7"
          >
            <Play className="h-3 w-3 mr-1" /> Initialize
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function TradingBotsView() {
  const { wsData } = useAppStore();
  const bots = wsData?.bots ?? [];
  const health = wsData?.health ?? 0;
  const governanceRules = wsData?.governance_rules;

  const activeBots = bots.filter((b) => b.active);
  const inactiveBots = bots.filter((b) => !b.active);
  const guardianBot = bots.find((b) => b.isGuardian);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trading Bots</h1>
          <p className="text-sm text-muted-foreground">
            {activeBots.length} active / {bots.length} total bots
          </p>
        </div>
        {governanceRules?.halt_trading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Trading Halted by Governance</span>
          </div>
        )}
      </div>

      {/* Permission Matrix */}
      <Card className="card-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-medium text-emerald-400 mb-1">FULL ACCESS</div>
              <div className="text-muted-foreground">All strategies, any size, any pair</div>
              <div className="mt-1 text-emerald-400">{bots.filter((b) => b.risk === 'HIGH' && b.active).length} active</div>
            </div>
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <div className="font-medium text-amber-400 mb-1">LIMITED</div>
              <div className="text-muted-foreground">Moderate size, approved pairs only</div>
              <div className="mt-1 text-amber-400">{bots.filter((b) => b.risk === 'MED' && b.active).length} active</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50 border border-border">
              <div className="font-medium text-emerald-400 mb-1">RESTRICTED</div>
              <div className="text-muted-foreground">Small size, major pairs only</div>
              <div className="mt-1 text-muted-foreground">{bots.filter((b) => b.risk === 'LOW' && b.active).length} active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardian Bot */}
      {guardianBot && (
        <Card className={cn('card-glow', guardianBot.active && 'border-amber-500/30')}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className={cn('h-6 w-6', guardianBot.active ? 'text-amber-400' : 'text-muted-foreground')} />
                <div>
                  <div className="font-semibold">{guardianBot.name}</div>
                  <div className="text-xs text-muted-foreground">{guardianBot.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn(guardianBot.active ? 'border-amber-500/50 text-amber-400' : 'border-border text-muted-foreground')}>
                  {guardianBot.active ? 'GUARDING' : 'INACTIVE'}
                </Badge>
                <Switch
                  checked={guardianBot.active}
                  onCheckedChange={async () => {
                    const result = await omnitradeApi.toggleBot(guardianBot.id);
                    if (result) {
                      toast.success(`Guardian ${result.active ? 'activated' : 'deactivated'}`);
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Bots */}
      {activeBots.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Active Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeBots.filter((b) => !b.isGuardian).map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Bots */}
      {inactiveBots.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Inactive Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {inactiveBots.filter((b) => !b.isGuardian).map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        </div>
      )}

      {bots.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Connect to Omnitrade backend to see trading bots</p>
        </div>
      )}
    </div>
  );
}
