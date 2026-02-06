/**
 * reef-api.ts — Direct HTTP client for reef-core (used in browser/dev mode without Electron IPC)
 * Falls back to this when window.reef is not available (e.g., running in browser via vite dev)
 */

const BASE = 'http://localhost:7777'

async function api(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const reefApi = {
  status: async () => {
    try {
      const data = await api('GET', '/status')
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
  sessions: async () => {
    try {
      const data = await api('GET', '/sessions')
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
  spawn: async (
    task: string,
    opts?: { provider?: string; model?: string; workdir?: string; backend?: string }
  ) => {
    try {
      const body: any = { task, ...opts }
      const data = await api('POST', '/sessions', body)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
  history: async (sessionId: string, _lines?: number) => {
    try {
      const data = await api('GET', `/sessions/${sessionId}/output`)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
  send: async (sessionId: string, message: string) => {
    try {
      const data = await api('POST', `/sessions/${sessionId}/send`, { message })
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
  kill: async (sessionId: string) => {
    try {
      const data = await api('DELETE', `/sessions/${sessionId}`)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  },
}
