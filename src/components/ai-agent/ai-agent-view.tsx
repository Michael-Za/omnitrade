'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { vibeTradingApi } from '@/lib/api/vibe-trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, Send, Plus, Trash2, Pen, Users, Wrench, Loader2,
  ChevronDown, ChevronUp, Copy, Check, MessageSquare, X, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SessionItem, AgentMessage, SwarmPreset } from '@/lib/api/types';

export function AIAgentView() {
  const {
    sessions, setSessions, activeSessionId, setActiveSessionId,
    agentMessages, addAgentMessage, clearAgentMessages,
    isAgentStreaming, setAgentStreaming, vibeTradingStatus,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [swarmPresets, setSwarmPresets] = useState<SwarmPreset[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [showSessionList, setShowSessionList] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [toolCalls, setToolCalls] = useState<Array<{ id: string; tool: string; status: string; elapsed_ms?: number }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadSessions = async () => {
    const s = await vibeTradingApi.listSessions();
    if (s) setSessions(s);
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load swarm presets
  useEffect(() => {
    vibeTradingApi.listSwarmPresets().then((presets) => {
      if (presets) setSwarmPresets(presets);
    });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const createSession = async () => {
    const session = await vibeTradingApi.createSession('New Chat');
    if (session) {
      setSessions([session, ...sessions]);
      setActiveSessionId(session.session_id);
      clearAgentMessages();
      setToolCalls([]);
      toast.success('New session created');
    } else {
      toast.error('Failed to create session');
    }
  };

  const deleteSession = async (id: string) => {
    await vibeTradingApi.deleteSession(id);
    setSessions(sessions.filter((s) => s.session_id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      clearAgentMessages();
      setToolCalls([]);
    }
    toast.success('Session deleted');
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameTitle(currentTitle || '');
  };

  const confirmRename = async (id: string) => {
    await vibeTradingApi.renameSession(id, renameTitle);
    setSessions(sessions.map((s) => s.session_id === id ? { ...s, title: renameTitle } : s));
    setRenamingId(null);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeSessionId || isAgentStreaming) return;

    const content = input.trim();
    setInput('');

    // Add user message
    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: Date.now(),
    };
    addAgentMessage(userMsg);

    // Send to backend
    setAgentStreaming(true);
    const result = await vibeTradingApi.sendMessage(activeSessionId, content);

    if (!result) {
      addAgentMessage({
        id: `error-${Date.now()}`,
        type: 'error',
        content: 'Failed to send message. Check if Vibe-Trading backend is running on port 8001.',
        timestamp: Date.now(),
      });
      setAgentStreaming(false);
      return;
    }

    // Connect to SSE for streaming response
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = vibeTradingApi.createSSEConnection(
      activeSessionId,
      (msg) => {
        addAgentMessage(msg);

        // Track tool calls
        if (msg.type === 'tool_call') {
          setToolCalls((prev) => [...prev, {
            id: msg.id,
            tool: msg.tool || 'unknown',
            status: 'running',
            elapsed_ms: msg.elapsed_ms,
          }]);
        } else if (msg.type === 'tool_result') {
          setToolCalls((prev) =>
            prev.map((tc) => tc.id === msg.id ? { ...tc, status: msg.status || 'ok', elapsed_ms: msg.elapsed_ms } : tc)
          );
        }

        if (msg.type === 'run_complete' || msg.type === 'error') {
          setAgentStreaming(false);
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
        }
      },
      () => {
        setAgentStreaming(false);
        eventSourceRef.current = null;
      }
    );

    if (es) {
      eventSourceRef.current = es;
    } else {
      setAgentStreaming(false);
    }
  }, [input, activeSessionId, isAgentStreaming, addAgentMessage, setAgentStreaming]);

  const cancelStream = async () => {
    if (activeSessionId) {
      await vibeTradingApi.cancelSession(activeSessionId);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setAgentStreaming(false);
  };

  const startSwarmRun = async (preset: SwarmPreset) => {
    const userVars: Record<string, string> = {};
    preset.variables.forEach((v) => {
      userVars[v.name] = prompt(`Enter ${v.description}:`) || '';
    });

    const result = await vibeTradingApi.createSwarmRun(preset.name, userVars);
    if (result) {
      toast.success(`Swarm run started: ${preset.title}`);
      setActiveTab('swarm');
    } else {
      toast.error('Failed to start swarm run');
    }
  };

  return (
    <div className="flex h-full">
      {/* Session Sidebar */}
      <div className={cn('border-r border-border flex flex-col', showSessionList ? 'w-60' : 'w-0 overflow-hidden')}>
        <div className="p-3 border-b border-border">
          <Button variant="outline" size="sm" onClick={createSession} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.session_id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer group',
                activeSessionId === s.session_id ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
              )}
              onClick={() => {
                setActiveSessionId(s.session_id);
                clearAgentMessages();
                setToolCalls([]);
                // Load messages for this session
                vibeTradingApi.getSessionMessages(s.session_id).then((msgs) => {
                  if (msgs) {
                    msgs.forEach((m) => {
                      addAgentMessage({
                        id: m.message_id,
                        type: m.role === 'user' ? 'user' : 'answer',
                        content: m.content,
                        timestamp: new Date(m.created_at).getTime(),
                      });
                    });
                  }
                });
              }}
            >
              <MessageSquare className="h-3 w-3 flex-shrink-0" />
              {renamingId === s.session_id ? (
                <Input
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRename(s.session_id)}
                  className="h-6 text-xs"
                  autoFocus
                />
              ) : (
                <span className="truncate flex-1">{s.title || s.session_id.slice(0, 8)}</span>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); startRename(s.session_id, s.title || ''); }} className="p-0.5 hover:text-primary">
                  <Pen className="h-3 w-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.session_id); }} className="p-0.5 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSessionList(!showSessionList)} className="h-8 w-8">
              {showSessionList ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <h1 className="text-sm font-semibold flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" /> AI Agent
              </h1>
              {activeSessionId && (
                <p className="text-[10px] text-muted-foreground">Session: {activeSessionId.slice(0, 12)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-[10px]', vibeTradingStatus === 'connected' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400')}>
              {vibeTradingStatus === 'connected' ? 'Vibe: ONLINE' : 'Vibe: OFFLINE'}
            </Badge>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-7">
                <TabsTrigger value="chat" className="text-xs px-2 h-5">Chat</TabsTrigger>
                <TabsTrigger value="swarm" className="text-xs px-2 h-5">Swarm</TabsTrigger>
                <TabsTrigger value="tools" className="text-xs px-2 h-5">Tools</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {!activeSessionId ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Brain className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">AI Trading Agent</p>
                    <p className="text-sm mb-4">Create a session to start chatting</p>
                    <Button onClick={createSession}>
                      <Plus className="h-4 w-4 mr-2" /> New Chat Session
                    </Button>
                  </div>
                ) : agentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">Describe a trading strategy or ask a question</p>
                  </div>
                ) : (
                  agentMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                {isAgentStreaming && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Agent is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              {activeSessionId && (
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Describe a strategy, ask about markets, or request analysis..."
                      disabled={isAgentStreaming}
                      className="flex-1"
                    />
                    {isAgentStreaming ? (
                      <Button variant="destructive" size="icon" onClick={cancelStream}>
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'swarm' && (
            <div className="p-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Multi-Agent Swarm
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Launch orchestrated multi-agent workflows for complex analysis tasks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {swarmPresets.length > 0 ? swarmPresets.map((preset) => (
                  <Card key={preset.name} className="card-glow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium">{preset.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{preset.agent_count} agents</Badge>
                        <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => startSwarmRun(preset)}>
                          <Play className="h-3 w-3 mr-1" /> Launch
                        </Button>
                      </div>
                      {preset.variables.length > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          Variables: {preset.variables.map((v) => v.name).join(', ')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground text-xs">
                    {vibeTradingStatus === 'connected' ? 'No swarm presets available' : 'Connect to Vibe-Trading backend on port 8001'}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="p-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-primary" /> Tool Call Tracking
              </h2>
              <div className="space-y-2">
                {toolCalls.length > 0 ? toolCalls.map((tc) => (
                  <div key={tc.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border text-xs">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-medium">{tc.tool}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tc.elapsed_ms && <span className="text-muted-foreground">{tc.elapsed_ms}ms</span>}
                      <Badge variant="outline" className={cn(
                        'text-[10px] px-1.5',
                        tc.status === 'ok' ? 'border-emerald-500/50 text-emerald-400' :
                        tc.status === 'running' ? 'border-amber-500/50 text-amber-400' :
                        'border-red-500/50 text-red-400'
                      )}>
                        {tc.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Tool calls will appear here when the agent uses tools
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const copyContent = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary/15 border border-primary/20 rounded-lg px-3 py-2 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'thinking') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="h-3 w-3" />
            <span className="font-medium">Thinking{message.stage ? `: ${message.stage}` : ''}</span>
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === 'tool_call') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-amber-400" />
            <span className="font-medium text-amber-400">Tool: {message.tool}</span>
            {message.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-amber-400" />}
            {message.elapsed_ms && <span className="text-muted-foreground ml-auto">{message.elapsed_ms}ms</span>}
          </div>
          {message.args && Object.keys(message.args).length > 0 && (
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {Object.entries(message.args).map(([k, v]) => (
                <span key={k}>{k}: {v} </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.type === 'tool_result') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Result: {message.tool}</span>
            <Badge variant="outline" className={cn(
              'text-[10px] px-1 ml-auto',
              message.status === 'ok' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'
            )}>
              {message.status || 'done'}
            </Badge>
          </div>
          <pre className="whitespace-pre-wrap text-[10px] text-muted-foreground max-h-32 overflow-y-auto custom-scrollbar">
            {message.content.slice(0, 500)}
          </pre>
        </div>
      </div>
    );
  }

  if (message.type === 'run_complete') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="font-medium text-emerald-400">Run Complete</span>
            {message.runId && <span className="text-muted-foreground ml-auto">{message.runId.slice(0, 12)}</span>}
          </div>
          {message.metrics && (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {Object.entries(message.metrics).slice(0, 6).map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted-foreground">{k}: </span>
                  <span className="font-medium">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-muted-foreground">{message.content.slice(0, 300)}</p>
        </div>
      </div>
    );
  }

  // Default: answer
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-card border border-border rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-1.5 mb-1">
          <Brain className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">AI</span>
          <button onClick={copyContent} className="ml-auto p-0.5 hover:text-primary">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
      </div>
    </div>
  );
}

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
