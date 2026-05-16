'use client';

import { useState } from 'react';
import { vibeTradingApi } from '@/lib/api/vibe-trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ghost, BookOpen, FileText, BarChart3, Upload, ArrowRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShadowReport {
  id: string;
  created_at: string;
  rules_extracted: number;
  signals_matched: number;
  noise_trades: number;
  missed_signals: number;
  attribution: {
    alpha_from_rules: number;
    lost_to_noise: number;
    missed_opportunity: number;
    execution_slippage: number;
  };
}

const MOCK_SHADOW_REPORTS: ShadowReport[] = [
  {
    id: 'shadow-001',
    created_at: '2024-12-15',
    rules_extracted: 12,
    signals_matched: 45,
    noise_trades: 8,
    missed_signals: 15,
    attribution: { alpha_from_rules: 0.23, lost_to_noise: -0.05, missed_opportunity: -0.12, execution_slippage: -0.02 },
  },
  {
    id: 'shadow-002',
    created_at: '2024-11-28',
    rules_extracted: 8,
    signals_matched: 32,
    noise_trades: 5,
    missed_signals: 11,
    attribution: { alpha_from_rules: 0.18, lost_to_noise: -0.03, missed_opportunity: -0.08, execution_slippage: -0.01 },
  },
];

export function ShadowAccountView() {
  const [activeTab, setActiveTab] = useState('overview');
  const [journalText, setJournalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImportJournal = () => {
    if (!journalText.trim()) {
      toast.error('Enter journal content first');
      return;
    }
    setIsProcessing(true);
    toast.success('Journal imported. Use the AI Agent with "shadow-account" skill to process it.');
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Ghost className="h-5 w-5 text-primary" /> Shadow Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Self-improving trading: Journal → Rule Extraction → Shadow Backtest → Attribution
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="journal" className="text-xs">Journal Import</TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">Rule Extraction</TabsTrigger>
          <TabsTrigger value="attribution" className="text-xs">Attribution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <BookOpen className="h-3.5 w-3.5" /> Journals Processed
                </div>
                <div className="text-2xl font-bold">2</div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" /> Rules Extracted
                </div>
                <div className="text-2xl font-bold">20</div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Signals Matched
                </div>
                <div className="text-2xl font-bold text-emerald-400">77</div>
              </CardContent>
            </Card>
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <BarChart3 className="h-3.5 w-3.5" /> Alpha from Rules
                </div>
                <div className="text-2xl font-bold text-emerald-400">+20.5%</div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Diagram */}
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Shadow Account Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 py-4 flex-wrap">
                {[
                  { label: 'Journal', icon: BookOpen, color: 'text-blue-400' },
                  { label: 'Rules', icon: FileText, color: 'text-amber-400' },
                  { label: 'Shadow Backtest', icon: BarChart3, color: 'text-purple-400' },
                  { label: 'Attribution', icon: Ghost, color: 'text-primary' },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                      <step.icon className={cn('h-6 w-6', step.color)} />
                      <span className="text-xs font-medium">{step.label}</span>
                    </div>
                    {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Use the AI Agent with &quot;shadow-account&quot; skill to process your trading journal through the full pipeline
              </p>
            </CardContent>
          </Card>

          {/* Shadow Reports */}
          <Card className="card-glow mt-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Shadow Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_SHADOW_REPORTS.map((report) => (
                  <div key={report.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{report.id}</span>
                        <Badge variant="outline" className="text-[10px]">{report.created_at}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-6">
                        View Details
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Rules:</span>
                        <span className="font-medium ml-1">{report.rules_extracted}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Matched:</span>
                        <span className="font-medium ml-1 text-emerald-400">{report.signals_matched}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Noise:</span>
                        <span className="font-medium ml-1 text-red-400">{report.noise_trades}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Missed:</span>
                        <span className="font-medium ml-1 text-amber-400">{report.missed_signals}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Import Tab */}
        <TabsContent value="journal" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Import Trading Journal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste your trading journal entries. The Shadow Account system will extract rules, identify patterns, and generate a shadow backtest.
              </p>
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder={`Example format:
2024-12-01: Bought BTC at 96500. RSI was oversold at 28. Volume spike confirmed reversal.
2024-12-02: Sold BTC at 98200. Hit target at 1.5x ATR. Felt good about the entry.
2024-12-03: Bought ETH at 3550. Followed the crowd, no clear signal. Regret.
2024-12-05: Sold ETH at 3480. Cut loss early. Should have waited for stop.`}
                className="w-full h-64 rounded-md bg-muted/50 border border-border p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleImportJournal} disabled={isProcessing} className="text-xs h-8">
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" /> Import Journal
                    </>
                  )}
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  Or upload a CSV/JSON file via the AI Agent
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rule Extraction Tab */}
        <TabsContent value="rules" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Extracted Trading Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { rule: 'Buy when RSI < 30 and volume > 1.5x average', source: 'Journal pattern #3', confidence: 0.85 },
                  { rule: 'Sell at 1.5x ATR profit target', source: 'Journal pattern #1', confidence: 0.78 },
                  { rule: 'Do not enter without clear signal (avoid FOMO)', source: 'Regret trade analysis', confidence: 0.92 },
                  { rule: 'Cut losses at 1x ATR stop', source: 'Journal pattern #2', confidence: 0.71 },
                  { rule: 'Wait for session open confirmation before entry', source: 'Time-based analysis', confidence: 0.65 },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{item.rule}</span>
                      <Badge variant="outline" className={cn(
                        'text-[10px] px-1.5',
                        item.confidence >= 0.8 ? 'border-emerald-500/50 text-emerald-400' :
                        item.confidence >= 0.6 ? 'border-amber-500/50 text-amber-400' :
                        'border-red-500/50 text-red-400'
                      )}>
                        {(item.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Source: {item.source}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Performance Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Alpha from Rules', value: '+20.5%', icon: CheckCircle, color: 'text-emerald-400', desc: 'Returns from following extracted rules' },
                  { label: 'Lost to Noise Trades', value: '-3.8%', icon: XCircle, color: 'text-red-400', desc: 'Impulse/FOMO trades with no signal' },
                  { label: 'Missed Opportunities', value: '-10.2%', icon: AlertTriangle, color: 'text-amber-400', desc: 'Signals you missed or ignored' },
                  { label: 'Execution Slippage', value: '-1.5%', icon: BarChart3, color: 'text-purple-400', desc: 'Entry/exit timing vs ideal' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className={cn('h-5 w-5', item.color)} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className={cn('text-2xl font-bold', item.color)}>{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Attribution Breakdown Bar */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-xs font-medium mb-2">Attribution Breakdown</div>
                <div className="h-6 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '56%' }} title="Alpha from Rules" />
                  <div className="bg-red-500 h-full" style={{ width: '10%' }} title="Noise Trades" />
                  <div className="bg-amber-500 h-full" style={{ width: '28%' }} title="Missed Opportunities" />
                  <div className="bg-purple-500 h-full" style={{ width: '6%' }} title="Execution Slippage" />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Rules Alpha</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Noise</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Missed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Slippage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
