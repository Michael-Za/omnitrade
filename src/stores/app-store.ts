// ============================================================================
// Omnitrade Unified - Global App Store (Zustand)
// ============================================================================

import { create } from 'zustand';
import type {
  ViewId,
  AppSettings,
  OmnitradeWSMessage,
  BotConfig,
  AgentMessage,
  SessionItem,
} from '@/lib/api/types';

const DEFAULT_SETTINGS: AppSettings = {
  binanceApiKey: '',
  binanceApiSecret: '',
  bybitApiKey: '',
  bybitApiSecret: '',
  okxApiKey: '',
  okxApiSecret: '',
  llmProvider: 'openai',
  llmApiKey: '',
  llmModelName: 'gpt-4o',
  llmBaseUrl: '',
  llmTemperature: 0,
  llmReasoningEffort: '',
  tushareToken: '',
  coingeckoApiKey: '',
  dexscreenerEnabled: true,
  defaultLeverage: 3,
  maxPositionSize: 10000,
  riskLimitPct: 2,
  allowedPairs: 'BTC/USDT,ETH/USDT,SOL/USDT',
  alertThreshold: 5,
  webhookUrl: '',
  googleSheetId: '',
  googleServiceAccountJson: '',
};

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('omnitrade-settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('omnitrade-settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface AppState {
  // Navigation
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Connection status
  omnitradeStatus: 'connected' | 'disconnected' | 'connecting';
  vibeTradingStatus: 'connected' | 'disconnected' | 'connecting';
  setOmnitradeStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  setVibeTradingStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;

  // Omnitrade data (from WebSocket)
  wsData: OmnitradeWSMessage | null;
  setWsData: (data: OmnitradeWSMessage) => void;
  bots: BotConfig[];
  setBots: (bots: BotConfig[]) => void;

  // AI Agent
  sessions: SessionItem[];
  setSessions: (sessions: SessionItem[]) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  agentMessages: AgentMessage[];
  addAgentMessage: (msg: AgentMessage) => void;
  clearAgentMessages: () => void;
  isAgentStreaming: boolean;
  setAgentStreaming: (streaming: boolean) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Connection
  omnitradeStatus: 'disconnected',
  vibeTradingStatus: 'disconnected',
  setOmnitradeStatus: (status) => set({ omnitradeStatus: status }),
  setVibeTradingStatus: (status) => set({ vibeTradingStatus: status }),

  // Omnitrade data
  wsData: null,
  setWsData: (data) => set({ wsData: data, bots: data.bots }),
  bots: [],
  setBots: (bots) => set({ bots }),

  // AI Agent
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  agentMessages: [],
  addAgentMessage: (msg) =>
    set((state) => {
      const exists = state.agentMessages.find((m) => m.id === msg.id);
      if (exists) {
        return {
          agentMessages: state.agentMessages.map((m) => (m.id === msg.id ? msg : m)),
        };
      }
      return { agentMessages: [...state.agentMessages, msg] };
    }),
  clearAgentMessages: () => set({ agentMessages: [] }),
  isAgentStreaming: false,
  setAgentStreaming: (streaming) => set({ isAgentStreaming: streaming }),

  // Settings
  settings: typeof window !== 'undefined' ? loadSettings() : DEFAULT_SETTINGS,
  updateSettings: (partial) => {
    const newSettings = { ...get().settings, ...partial };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  // Theme
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
