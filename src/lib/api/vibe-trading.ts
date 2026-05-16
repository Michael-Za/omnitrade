// ============================================================================
// Vibe-Trading Backend API Client
// REST API + SSE connection to Vibe-Trading Python backend (port 8001)
// ============================================================================

import type {
  LLMSettings,
  DataSourceSettings,
  SessionItem,
  MessageItem,
  RunListItem,
  RunData,
  SwarmPreset,
  SwarmRunSummary,
  AgentMessage,
} from './types';

const VIBE_BASE = '/api/vibe';

class VibeTradingApi {
  // --- Health ---

  async checkHealth(): Promise<{ status: string }> {
    try {
      const res = await fetch(`${VIBE_BASE}/health`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) throw new Error('offline');
      return res.json();
    } catch {
      return { status: 'offline' };
    }
  }

  // --- Sessions ---

  async listSessions(): Promise<SessionItem[]> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async createSession(title?: string): Promise<SessionItem | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify({ title: title || '' }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async deleteSession(sid: string): Promise<boolean> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions/${sid}`, {
        method: 'DELETE',
        headers: { 'X-Transform-Port': '8001' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async renameSession(sid: string, title: string): Promise<boolean> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify({ title }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendMessage(sid: string, content: string): Promise<{ message_id: string; attempt_id: string } | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getSessionMessages(sid: string): Promise<MessageItem[]> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions/${sid}/messages`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async cancelSession(sid: string): Promise<boolean> {
    try {
      const res = await fetch(`${VIBE_BASE}/sessions/${sid}/cancel`, {
        method: 'POST',
        headers: { 'X-Transform-Port': '8001' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- SSE Stream ---

  createSSEConnection(sid: string, onMessage: (msg: AgentMessage) => void, onError?: () => void): EventSource | null {
    try {
      const url = `${VIBE_BASE}/sessions/${sid}/events?XTransformPort=8001`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data as AgentMessage);
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        onError?.();
      };

      return eventSource;
    } catch {
      return null;
    }
  }

  // --- Runs ---

  async listRuns(limit = 20): Promise<RunListItem[]> {
    try {
      const res = await fetch(`${VIBE_BASE}/runs?limit=${limit}`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async getRun(runId: string): Promise<RunData | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/runs/${runId}`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getRunCode(runId: string): Promise<Record<string, string> | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/runs/${runId}/code`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getRunPine(runId: string): Promise<{ exists: boolean; content: string | null } | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/runs/${runId}/pine`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  // --- Swarm ---

  async listSwarmPresets(): Promise<SwarmPreset[]> {
    try {
      const res = await fetch(`${VIBE_BASE}/swarm/presets`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async createSwarmRun(presetName: string, userVars: Record<string, string>): Promise<{ id: string; status: string } | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/swarm/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify({ preset_name: presetName, user_vars: userVars }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async listSwarmRuns(): Promise<SwarmRunSummary[]> {
    try {
      const res = await fetch(`${VIBE_BASE}/swarm/runs`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }

  async getSwarmRun(id: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/swarm/runs/${id}`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async cancelSwarmRun(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${VIBE_BASE}/swarm/runs/${id}/cancel`, {
        method: 'POST',
        headers: { 'X-Transform-Port': '8001' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  createSwarmSSEConnection(id: string, onMessage: (msg: AgentMessage) => void, onError?: () => void): EventSource | null {
    try {
      const url = `${VIBE_BASE}/swarm/runs/${id}/events?XTransformPort=8001`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data as AgentMessage);
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        onError?.();
      };

      return eventSource;
    } catch {
      return null;
    }
  }

  // --- Settings ---

  async getLLMSettings(): Promise<LLMSettings | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/settings/llm`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async updateLLMSettings(settings: {
    provider: string;
    model_name: string;
    base_url?: string;
    api_key?: string;
    clear_api_key?: boolean;
    temperature: number;
    timeout_seconds: number;
    max_retries: number;
    reasoning_effort?: string;
  }): Promise<LLMSettings | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/settings/llm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async getDataSourceSettings(): Promise<DataSourceSettings | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/settings/data-sources`, {
        headers: { 'X-Transform-Port': '8001' },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async updateDataSourceSettings(settings: {
    tushare_token?: string;
    clear_tushare_token?: boolean;
  }): Promise<DataSourceSettings | null> {
    try {
      const res = await fetch(`${VIBE_BASE}/settings/data-sources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Transform-Port': '8001' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }
}

export const vibeTradingApi = new VibeTradingApi();
