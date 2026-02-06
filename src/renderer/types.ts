// Re-export shared types from reef-core source of truth
export type {
  SessionRow as ReefSession,
  SessionStatus,
  Provider,
  Backend,
  ReefEvent,
  SpawnRequest,
  SpawnResponse,
  StatusResponse,
  SessionListResponse,
  WsClientMessage,
  WsServerMessage,
  WsMessage,
} from './shared-types'

import type { SessionRow } from './shared-types'

export interface AppState {
  sessions: SessionRow[]
  selectedSession: string | null
  connected: boolean
  theme: 'dark' | 'light'
}

declare global {
  interface Window {
    reef: {
      status: () => Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>
      sessions: () => Promise<{
        ok: boolean
        data?: { sessions: SessionRow[] }
        error?: string
      }>
      spawn: (
        task: string,
        opts?: { provider?: string; model?: string; workdir?: string; backend?: string }
      ) => Promise<{ ok: boolean; data?: { session: SessionRow }; error?: string }>
      history: (
        sessionId: string,
        lines?: number
      ) => Promise<{ ok: boolean; data?: { id: string; output: string }; error?: string }>
      send: (
        sessionId: string,
        message: string
      ) => Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>
      kill: (
        sessionId: string
      ) => Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>
    }
  }
}

export {}
