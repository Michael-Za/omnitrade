
import { ScannerState, BotConfig, SystemMetrics, ExecutionLog, GovernanceMode, TickerPrice, TechnicalIndicators, MemeCoinAnalysis, StockData } from "../types";

export interface BackendData {
    scanners: ScannerState & { rotation: any[], correlation: any };
    bots: BotConfig[];
    health: number;
    mode: GovernanceMode;
    metrics: SystemMetrics;
    logs: ExecutionLog[];
    prices: Record<string, TickerPrice>;
    indicators: Record<string, TechnicalIndicators>;
    governance_rules: {
        bot_status: string;
        size_reduction: number;
        max_positions: number;
        allowed_risks: string[];
    };
    timestamp: string;
    data_source: 'LIVE' | 'MOCK';
}

class BackendService {
    private socket: WebSocket | null = null;
    private listeners: ((data: BackendData) => void)[] = [];
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 50;
    private wsUrl: string = "ws://localhost:8000/ws";
    private apiBaseUrl: string = "http://localhost:8000";

    connect(url: string = "ws://localhost:8000/ws") {
        this.wsUrl = url;
        this.apiBaseUrl = url.replace('/ws', '').replace('ws://', 'http://').replace('wss://', 'https://');

        try {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log("WebSocket connected to", url);
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data: BackendData = JSON.parse(event.data);
                    this.listeners.forEach(l => l(data));
                } catch (e) {
                    console.error("Error parsing WebSocket data:", e);
                }
            };

            this.socket.onclose = () => {
                console.log("WebSocket disconnected.");
                this.reconnectAttempts++;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    const delay = Math.min(5000 * this.reconnectAttempts, 30000);
                    console.log(`Retrying in ${delay / 1000}s... (attempt ${this.reconnectAttempts})`);
                    setTimeout(() => this.connect(url), delay);
                }
            };

            this.socket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
        } catch (e) {
            console.error("Failed to create WebSocket:", e);
        }
    }

    subscribe(callback: (data: BackendData) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    async initializeBot(botId: string) {
        try {
            await fetch(`${this.apiBaseUrl}/api/bots/${botId}/initialize`, {
                method: 'POST'
            });
        } catch (error) {
            console.error(`Error initializing bot ${botId}:`, error);
        }
    }

    async toggleBot(botId: string) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/bots/${botId}/toggle`, {
                method: 'POST'
            });
            return await res.json();
        } catch (error) {
            console.error(`Error toggling bot ${botId}:`, error);
            return null;
        }
    }

    async getPrices() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/prices`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching prices:", error);
            return {};
        }
    }

    async getStocks() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/stocks`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching stocks:", error);
            return {};
        }
    }

    async getMemeCoins() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/meme-coins`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching meme coins:", error);
            return {};
        }
    }

    async getSentiment() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/sentiment`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching sentiment:", error);
            return {};
        }
    }

    async getIndicators(symbol: string, timeframe: string = "15m") {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/indicators/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
            return await res.json();
        } catch (error) {
            console.error(`Error fetching indicators for ${symbol}:`, error);
            return null;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const backendService = new BackendService();
