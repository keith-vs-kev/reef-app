import { create } from 'zustand'
import type { SessionRow } from '../shared-types'

export type ReefSession = SessionRow

interface SessionState {
  sessions: ReefSession[]
  selectedSessionId: string | null
  connected: boolean
  uptime: number | undefined
  loading: boolean

  // Actions
  setSessions: (sessions: ReefSession[]) => void
  addSession: (session: ReefSession) => void
  updateSession: (id: string, patch: Partial<ReefSession>) => void
  removeSession: (id: string) => void
  selectSession: (id: string | null) => void
  setConnected: (connected: boolean) => void
  setUptime: (uptime: number | undefined) => void
  setLoading: (loading: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  selectedSessionId: null,
  connected: false,
  uptime: undefined,
  loading: true,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [...s.sessions, session] })),
  updateSession: (id, patch) =>
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...patch } : sess)),
    })),
  removeSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      selectedSessionId: s.selectedSessionId === id ? null : s.selectedSessionId,
    })),
  selectSession: (id) => set({ selectedSessionId: id }),
  setConnected: (connected) => set({ connected }),
  setUptime: (uptime) => set({ uptime }),
  setLoading: (loading) => set({ loading }),
}))

// Derived selectors
export const useSelectedSession = () =>
  useSessionStore((s) => s.sessions.find((sess) => sess.id === s.selectedSessionId))

export const useRunningSessions = () =>
  useSessionStore((s) => s.sessions.filter((sess) => sess.status === 'running'))

export const useCompletedSessions = () =>
  useSessionStore((s) => s.sessions.filter((sess) => sess.status !== 'running'))
