// ============================================================================
// Omnitrade Backend API Client
// REST API + WebSocket connection to Omnitrade Python backend (port 8000)
// ============================================================================

import type {
  TickerPrice,
  StockData,
  MemeCoinAnalysis,
  TechnicalIndicators,
  BotConfig,
  OmnitradeWSMessage,
} from './types';

const OMNITRADE_BASE = '/api/omnitrade';

class OmnitradeApi {
  private ws: WebSocket | null = null;
  private wsListeners: Set<(data: OmnitradeWSMessage) => void> = new Set();
  private wsStatusListeners: Set<(status: 'connected' | 'disconnected' | 'connecting') => void> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // --- REST API ---

  async checkHealth(): Promise<{ status: string; data_source: string }> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) throw new Error('Omnitrade backend offline');
      return res.json();
    } catch {
      return { status: 'offline', data_source: 'OFFLINE' };
    }
  }

  async getPrices(): Promise<Record<string, TickerPrice>> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/prices`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return {};
      return res.json();
    } catch {
      return {};
    }
  }

  async getPrice(symbol: string): Promise<TickerPrice | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/prices/${encodeURIComponent(symbol)}`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getStocks(): Promise<Record<string, StockData>> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/stocks`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return {};
      return res.json();
    } catch {
      return {};
    }
  }

  async getStock(symbol: string): Promise<StockData | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/stocks/${encodeURIComponent(symbol)}`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getSentiment(): Promise<{
    trending: Array<{ coin_id: string; name: string; symbol: string; market_cap_rank: number; price_btc: string }>;
    reddit_posts: Array<{ title: string; sentiment: string; score: number; url: string }>;
  } | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/sentiment`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getMemeCoins(): Promise<Record<string, MemeCoinAnalysis>> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/meme-coins`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return {};
      return res.json();
    } catch {
      return {};
    }
  }

  async getIndicators(symbol: string, timeframe = '15m'): Promise<TechnicalIndicators | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/indicators/${encodeURIComponent(symbol)}?timeframe=${timeframe}`, {
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async toggleBot(botId: string): Promise<{ status: string; bot: string; active: boolean } | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/bots/${botId}/toggle`, {
        method: 'POST',
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async initializeBot(botId: string): Promise<{ status: string; bot: string; active: boolean } | null> {
    try {
      const res = await fetch(`${OMNITRADE_BASE}/api/bots/${botId}/initialize`, {
        method: 'POST',
        headers: { 'X-Transform-Port': '8000' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  // --- WebSocket ---

  connectWS() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.notifyWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?XTransformPort=8000`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.notifyWsStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data: OmnitradeWSMessage = JSON.parse(event.data);
        this.wsListeners.forEach((listener) => listener(data));
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.notifyWsStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.notifyWsStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  disconnectWS() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyWsStatus('disconnected');
  }

  onWSMessage(listener: (data: OmnitradeWSMessage) => void): () => void {
    this.wsListeners.add(listener);
    return () => this.wsListeners.delete(listener);
  }

  onWSStatusChange(listener: (status: 'connected' | 'disconnected' | 'connecting') => void): () => void {
    this.wsStatusListeners.add(listener);
    return () => this.wsStatusListeners.delete(listener);
  }

  private notifyWsStatus(status: 'connected' | 'disconnected' | 'connecting') {
    this.wsStatusListeners.forEach((listener) => listener(status));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWS();
    }, 5000);
  }
}

export const omnitradeApi = new OmnitradeApi();
