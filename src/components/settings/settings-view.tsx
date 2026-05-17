'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { vibeTradingApi } from '@/lib/api/vibe-trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, Brain, Database, Shield, Bell, FileSpreadsheet, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { LLMSettings, LLMProviderOption } from '@/lib/api/types';

export function SettingsView() {
  const { settings, updateSettings } = useAppStore();
  const [llmSettings, setLlmSettings] = useState<LLMSettings | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    vibeTradingApi.getLLMSettings().then((s) => {
      if (s) setLlmSettings(s);
    });
  }, []);

  const handleChange = (key: string, value: string | number | boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);

    // Sync LLM settings to Vibe-Trading backend
    if (localSettings.llmProvider) {
      vibeTradingApi.updateLLMSettings({
        provider: localSettings.llmProvider,
        model_name: localSettings.llmModelName || 'gpt-4o',
        base_url: localSettings.llmBaseUrl || undefined,
        api_key: localSettings.llmApiKey || undefined,
        temperature: localSettings.llmTemperature,
        timeout_seconds: 120,
        max_retries: 2,
        reasoning_effort: localSettings.llmReasoningEffort || undefined,
      });
    }

    // Sync data source settings
    if (localSettings.tushareToken) {
      vibeTradingApi.updateDataSourceSettings({
        tushare_token: localSettings.tushareToken,
      });
    }

    setHasChanges(false);
    toast.success('Settings saved and synced to backend');
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    toast.info('Settings reset to saved values');
  };

  const s = localSettings;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure API keys, providers, and trading parameters</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-8">
              Reset
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="text-xs h-8">
            <Save className="h-3 w-3 mr-1" /> Save & Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="exchanges">
        <TabsList className="flex-wrap">
          <TabsTrigger value="exchanges" className="text-xs">Exchanges</TabsTrigger>
          <TabsTrigger value="llm" className="text-xs">LLM Providers</TabsTrigger>
          <TabsTrigger value="data-sources" className="text-xs">Data Sources</TabsTrigger>
          <TabsTrigger value="trading" className="text-xs">Trading Config</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="google-sheets" className="text-xs">Google Sheets</TabsTrigger>
        </TabsList>

        {/* Exchange API Keys */}
        <TabsContent value="exchanges" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-400" /> Binance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    value={s.binanceApiKey}
                    onChange={(e) => handleChange('binanceApiKey', e.target.value)}
                    placeholder="Enter Binance API Key"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">API Secret</Label>
                  <Input
                    type="password"
                    value={s.binanceApiSecret}
                    onChange={(e) => handleChange('binanceApiSecret', e.target.value)}
                    placeholder="Enter Binance API Secret"
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-orange-400" /> Bybit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    value={s.bybitApiKey}
                    onChange={(e) => handleChange('bybitApiKey', e.target.value)}
                    placeholder="Enter Bybit API Key"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">API Secret</Label>
                  <Input
                    type="password"
                    value={s.bybitApiSecret}
                    onChange={(e) => handleChange('bybitApiSecret', e.target.value)}
                    placeholder="Enter Bybit API Secret"
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-400" /> OKX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    value={s.okxApiKey}
                    onChange={(e) => handleChange('okxApiKey', e.target.value)}
                    placeholder="Enter OKX API Key"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">API Secret</Label>
                  <Input
                    type="password"
                    value={s.okxApiSecret}
                    onChange={(e) => handleChange('okxApiSecret', e.target.value)}
                    placeholder="Enter OKX API Secret"
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LLM Providers */}
        <TabsContent value="llm" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> LLM Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Provider</Label>
                  <Select value={s.llmProvider} onValueChange={(v) => handleChange('llmProvider', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {llmSettings?.providers?.map((p) => (
                        <SelectItem key={p.name} value={p.name}>{p.label}</SelectItem>
                      )) || (
                        <>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="ollama">Ollama (Local)</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="mistral">Mistral</SelectItem>
                          <SelectItem value="openrouter">OpenRouter</SelectItem>
                          <SelectItem value="siliconflow">SiliconFlow</SelectItem>
                          <SelectItem value="together">Together AI</SelectItem>
                          <SelectItem value="fireworks">Fireworks AI</SelectItem>
                          <SelectItem value="cerebras">Cerebras</SelectItem>
                          <SelectItem value="volcengine">Volcengine</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Model Name</Label>
                  <Input
                    value={s.llmModelName}
                    onChange={(e) => handleChange('llmModelName', e.target.value)}
                    placeholder="e.g., gpt-4o, deepseek-chat"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    value={s.llmApiKey}
                    onChange={(e) => handleChange('llmApiKey', e.target.value)}
                    placeholder="Enter LLM API Key"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base URL (optional)</Label>
                  <Input
                    value={s.llmBaseUrl}
                    onChange={(e) => handleChange('llmBaseUrl', e.target.value)}
                    placeholder="Custom endpoint URL"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Temperature: {s.llmTemperature}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={s.llmTemperature}
                    onChange={(e) => handleChange('llmTemperature', parseFloat(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reasoning Effort</Label>
                  <Select value={s.llmReasoningEffort || 'none'} onValueChange={(v) => handleChange('llmReasoningEffort', v === 'none' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {llmSettings && (
                <div className="p-3 rounded-md bg-muted/50 border border-border text-xs">
                  <div className="font-medium mb-1">Current Backend Status</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Provider: <span className="text-foreground">{llmSettings.provider}</span></div>
                    <div>Model: <span className="text-foreground">{llmSettings.model_name}</span></div>
                    <div>API Key: <span className={llmSettings.api_key_configured ? 'text-emerald-400' : 'text-red-400'}>
                      {llmSettings.api_key_configured ? 'Configured' : 'Not set'}
                    </span></div>
                    <div>Temperature: <span className="text-foreground">{llmSettings.temperature}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources */}
        <TabsContent value="data-sources" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" /> Data Source Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tushare Token</Label>
                  <Input
                    type="password"
                    value={s.tushareToken}
                    onChange={(e) => handleChange('tushareToken', e.target.value)}
                    placeholder="Enter Tushare API Token"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Required for China A-share market data</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CoinGecko API Key</Label>
                  <Input
                    type="password"
                    value={s.coingeckoApiKey}
                    onChange={(e) => handleChange('coingeckoApiKey', e.target.value)}
                    placeholder="Enter CoinGecko API Key (optional)"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">For enhanced rate limits on CoinGecko</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                  <div>
                    <Label className="text-xs font-medium">DexScreener</Label>
                    <p className="text-[10px] text-muted-foreground">Enable DexScreener data for new launch scanning</p>
                  </div>
                  <Switch
                    checked={s.dexscreenerEnabled}
                    onCheckedChange={(checked) => handleChange('dexscreenerEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Config */}
        <TabsContent value="trading" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" /> Trading Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Default Leverage</Label>
                  <Input
                    type="number"
                    value={s.defaultLeverage}
                    onChange={(e) => handleChange('defaultLeverage', parseInt(e.target.value) || 1)}
                    min="1"
                    max="125"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Position Size (USD)</Label>
                  <Input
                    type="number"
                    value={s.maxPositionSize}
                    onChange={(e) => handleChange('maxPositionSize', parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Risk Limit (%)</Label>
                  <Input
                    type="number"
                    value={s.riskLimitPct}
                    onChange={(e) => handleChange('riskLimitPct', parseFloat(e.target.value) || 0)}
                    step="0.5"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Maximum portfolio risk per trade</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Allowed Trading Pairs</Label>
                  <Input
                    value={s.allowedPairs}
                    onChange={(e) => handleChange('allowedPairs', e.target.value)}
                    placeholder="BTC/USDT,ETH/USDT,SOL/USDT"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Comma-separated list of allowed pairs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-400" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    value={s.alertThreshold}
                    onChange={(e) => handleChange('alertThreshold', parseFloat(e.target.value) || 0)}
                    step="1"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Alert when drawdown exceeds this percentage</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Webhook URL</Label>
                  <Input
                    value={s.webhookUrl}
                    onChange={(e) => handleChange('webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/..."
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Webhook endpoint for push notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Sheets */}
        <TabsContent value="google-sheets" className="mt-4">
          <Card className="card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Google Sheets Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Google Sheet ID</Label>
                  <Input
                    value={s.googleSheetId}
                    onChange={(e) => handleChange('googleSheetId', e.target.value)}
                    placeholder="Enter Sheet ID from URL"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Service Account JSON</Label>
                  <textarea
                    value={s.googleServiceAccountJson}
                    onChange={(e) => handleChange('googleServiceAccountJson', e.target.value)}
                    placeholder='{"type": "service_account", ...}'
                    className="w-full h-20 rounded-md bg-muted/50 border border-border p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
