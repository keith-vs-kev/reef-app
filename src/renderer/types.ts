// reef-core session from the API
export interface ReefSession {
  id: string;
  tmux_session?: string;
  task: string;
  status: 'running' | 'stopped' | 'error' | 'completed';
  provider?: 'anthropic' | 'openai' | 'google';
  backend?: 'sdk' | 'tmux' | 'openai' | 'google';
  model?: string;
  created_at: string;
  updated_at: string;
  project?: string;
}

export interface AppState {
  sessions: ReefSession[];
  selectedSession: string | null;
  connected: boolean;
  theme: 'dark' | 'light';
}

declare global {
  interface Window {
    reef: {
      status: () => Promise<{ ok: boolean; data?: any; error?: string }>;
      sessions: () => Promise<{ ok: boolean; data?: { sessions: ReefSession[] }; error?: string }>;
      spawn: (task: string, opts?: { provider?: string; model?: string; workdir?: string; backend?: string }) => Promise<{ ok: boolean; data?: { session: ReefSession }; error?: string }>;
      history: (sessionId: string, lines?: number) => Promise<{ ok: boolean; data?: { id: string; output: string }; error?: string }>;
      send: (sessionId: string, message: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
      kill: (sessionId: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
    };
  }
}

export {};
