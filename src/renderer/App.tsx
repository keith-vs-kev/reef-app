import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ReefSession, SessionStatus } from './types'
import { useReefApi } from './use-reef'
import { ReefWsClient, WsConnectionState } from './ws-client'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { SessionView } from './components/SessionView'
import { StatusBar } from './components/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { ActivityFeed } from './components/ActivityFeed'
import { SpawnModal } from './components/SpawnModal'
import { useToast } from './components/ToastContainer'

export function App() {
  const api = useReefApi()
  const { addToast } = useToast()

  const [sessions, setSessions] = useState<ReefSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [wsState, setWsState] = useState<WsConnectionState>('disconnected')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [uptime, setUptime] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [spawnOpen, setSpawnOpen] = useState(false)
  const [spawning, setSpawning] = useState(false)

  // Session output cache — accumulated from WS events
  const outputCache = useRef<Map<string, string[]>>(new Map())

  // Expose output cache for SessionView
  const getSessionOutput = useCallback((sessionId: string): string[] => {
    return outputCache.current.get(sessionId) || []
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  // Cmd+K / Cmd+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setSpawnOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // WebSocket client — single instance for the app lifetime
  const wsRef = useRef<ReefWsClient | null>(null)

  useEffect(() => {
    const ws = new ReefWsClient({
      onConnectionChange: (state) => {
        setWsState(state)
        setConnected(state === 'connected')
      },
      onSessionNew: (sessionId, data) => {
        const newSession: ReefSession = {
          id: sessionId,
          task: (data?.task as string) || '',
          status: 'running',
          backend: (data?.backend as ReefSession['backend']) || 'sdk',
          provider: data?.provider as ReefSession['provider'],
          model: data?.model as string,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setSessions((prev) => {
          if (prev.some((s) => s.id === sessionId)) return prev
          return [...prev, newSession]
        })
      },
      onSessionEnd: (sessionId, data) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  status: (data.reason === 'completed' ? 'completed' : 'stopped') as SessionStatus,
                }
              : s
          )
        )
      },
      onOutput: (sessionId, data) => {
        if (!outputCache.current.has(sessionId)) {
          outputCache.current.set(sessionId, [])
        }
        outputCache.current.get(sessionId)!.push(data.text)
        // Trigger re-render for the active session view via a state bump
        setSessions((prev) => [...prev])
      },
      onStatusChange: (sessionId, data) => {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: data.status } : s))
        )
      },
    })

    wsRef.current = ws
    ws.connect()

    return () => {
      ws.disconnect()
      wsRef.current = null
    }
  }, [])

  // Initial HTTP load (sessions + status) — WS handles real-time after
  const initialLoad = useCallback(async () => {
    try {
      const [statusResult, sessionsResult] = await Promise.all([api.status(), api.sessions()])

      if (statusResult.ok) {
        setConnected(true)
        setUptime(statusResult.data?.uptime)
      }

      if (sessionsResult.ok && sessionsResult.data?.sessions) {
        setSessions(sessionsResult.data.sessions)
      }
    } catch {
      // WS will handle connection state
    }
    setLoading(false)
  }, [api])

  useEffect(() => {
    initialLoad()
  }, [initialLoad])

  // Periodic uptime refresh (lightweight, every 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await api.status()
        if (result.ok) setUptime(result.data?.uptime)
      } catch {
        // ignore
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [api])

  // Spawn agent
  const handleSpawn = useCallback(
    async (task: string, opts?: { provider?: string; model?: string; workdir?: string }) => {
      setSpawning(true)
      try {
        const result = await api.spawn(task, opts)
        if (result.ok && result.data?.session) {
          setSessions((prev) => {
            if (prev.some((s) => s.id === result.data!.session.id)) return prev
            return [...prev, result.data!.session]
          })
          setSelectedSession(result.data.session.id)
          setSpawnOpen(false)
          addToast(`Agent spawned: ${task.substring(0, 40)}`, 'success')
        } else {
          addToast(`Spawn failed: ${result.error || 'unknown'}`, 'error')
        }
      } catch (err: unknown) {
        addToast(`Spawn error: ${(err as Error).message}`, 'error')
      }
      setSpawning(false)
    },
    [api, addToast]
  )

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const activeSession = sessions.find((s) => s.id === selectedSession)
  const activeSessionIndex = activeSession ? sessions.indexOf(activeSession) : -1

  return (
    <div className="flex flex-col h-screen w-screen select-none bg-reef-bg">
      <TopBar
        connected={connected}
        wsState={wsState}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
          onSpawnAgent={() => setSpawnOpen(true)}
          loading={loading}
        />
        <main className="flex flex-col flex-1 overflow-hidden bg-reef-bg relative">
          {activeSession ? (
            <SessionView
              session={activeSession}
              sessionIndex={activeSessionIndex}
              wsOutput={getSessionOutput(activeSession.id)}
            />
          ) : (
            <ActivityFeed
              sessions={sessions}
              connected={connected}
              onSelectSession={setSelectedSession}
              onSpawnAgent={() => setSpawnOpen(true)}
            />
          )}
        </main>
      </div>
      <StatusBar sessions={sessions} connected={connected} wsState={wsState} uptime={uptime} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => {
          setSelectedSession(id)
          setPaletteOpen(false)
        }}
        onToggleTheme={toggleTheme}
        onSpawnAgent={() => {
          setSpawnOpen(true)
          setPaletteOpen(false)
        }}
      />

      <SpawnModal
        open={spawnOpen}
        onClose={() => setSpawnOpen(false)}
        onSpawn={handleSpawn}
        spawning={spawning}
      />
    </div>
  )
}
