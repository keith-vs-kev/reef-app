import React, { useState, useEffect, useCallback } from 'react'
import { useReefApi } from './use-reef'
import { useSessionStore } from './stores/session-store'
import { useSettingsStore } from './stores/settings-store'
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

  // Session store
  const sessions = useSessionStore((s) => s.sessions)
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId)
  const connected = useSessionStore((s) => s.connected)
  const uptime = useSessionStore((s) => s.uptime)
  const loading = useSessionStore((s) => s.loading)
  const { setSessions, addSession, selectSession, setConnected, setUptime, setLoading } =
    useSessionStore()

  // Settings store
  const theme = useSettingsStore((s) => s.theme)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)

  // Local UI state
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [spawnOpen, setSpawnOpen] = useState(false)
  const [spawning, setSpawning] = useState(false)

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

  // Fetch sessions + status
  const refresh = useCallback(async () => {
    try {
      const [statusResult, sessionsResult] = await Promise.all([api.status(), api.sessions()])

      if (statusResult.ok) {
        setConnected(true)
        setUptime(statusResult.data?.uptime as number | undefined)
      } else {
        setConnected(false)
      }

      if (sessionsResult.ok && sessionsResult.data?.sessions) {
        setSessions(sessionsResult.data.sessions)
      }
    } catch {
      setConnected(false)
    }
    setLoading(false)
  }, [api, setConnected, setUptime, setSessions, setLoading])

  // Initial load + polling
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  // Spawn agent
  const handleSpawn = useCallback(
    async (task: string, opts?: { provider?: string; model?: string; workdir?: string }) => {
      setSpawning(true)
      try {
        const result = await api.spawn(task, opts)
        if (result.ok && result.data?.session) {
          addSession(result.data.session)
          selectSession(result.data.session.id)
          setSpawnOpen(false)
          addToast(`Agent spawned: ${task.substring(0, 40)}`, 'success')
        } else {
          addToast(`Spawn failed: ${result.error || 'unknown'}`, 'error')
        }
      } catch (err: any) {
        addToast(`Spawn error: ${err.message}`, 'error')
      }
      setSpawning(false)
    },
    [api, addToast, addSession, selectSession]
  )

  const activeSession = sessions.find((s) => s.id === selectedSessionId)
  const activeSessionIndex = activeSession ? sessions.indexOf(activeSession) : -1

  return (
    <div className="flex flex-col h-screen w-screen select-none bg-reef-bg">
      <TopBar
        connected={connected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sessions={sessions}
          selectedSession={selectedSessionId}
          onSelectSession={selectSession}
          onSpawnAgent={() => setSpawnOpen(true)}
          loading={loading}
        />
        <main className="flex flex-col flex-1 overflow-hidden bg-reef-bg relative">
          {activeSession ? (
            <SessionView session={activeSession} sessionIndex={activeSessionIndex} />
          ) : (
            <ActivityFeed
              sessions={sessions}
              connected={connected}
              onSelectSession={selectSession}
              onSpawnAgent={() => setSpawnOpen(true)}
            />
          )}
        </main>
      </div>
      <StatusBar sessions={sessions} connected={connected} uptime={uptime} />

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => {
          selectSession(id)
          setPaletteOpen(false)
        }}
        onToggleTheme={toggleTheme}
        onSpawnAgent={() => {
          setSpawnOpen(true)
          setPaletteOpen(false)
        }}
      />

      {/* Spawn Modal */}
      <SpawnModal
        open={spawnOpen}
        onClose={() => setSpawnOpen(false)}
        onSpawn={handleSpawn}
        spawning={spawning}
      />
    </div>
  )
}
