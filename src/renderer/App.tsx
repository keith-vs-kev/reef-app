import React, { useState, useEffect, useCallback } from 'react';
import { ReefSession, AppState } from './types';
import { useReefApi } from './use-reef';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { SessionView } from './components/SessionView';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { ActivityFeed } from './components/ActivityFeed';
import { SpawnModal } from './components/SpawnModal';
import { useToast } from './components/ToastContainer';

export function App() {
  const api = useReefApi();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState<ReefSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [uptime, setUptime] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [spawning, setSpawning] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Cmd+K / Cmd+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setSpawnOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch sessions + status
  const refresh = useCallback(async () => {
    try {
      const [statusResult, sessionsResult] = await Promise.all([
        api.status(),
        api.sessions(),
      ]);

      if (statusResult.ok) {
        setConnected(true);
        setUptime(statusResult.data?.uptime);
      } else {
        setConnected(false);
      }

      if (sessionsResult.ok && sessionsResult.data?.sessions) {
        setSessions(sessionsResult.data.sessions);
      }
    } catch {
      setConnected(false);
    }
    setLoading(false);
  }, [api]);

  // Initial load + polling
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Spawn agent
  const handleSpawn = useCallback(async (task: string, opts?: { provider?: string; model?: string; workdir?: string }) => {
    setSpawning(true);
    try {
      const result = await api.spawn(task, opts);
      if (result.ok && result.data?.session) {
        setSessions(prev => [...prev, result.data!.session]);
        setSelectedSession(result.data.session.id);
        setSpawnOpen(false);
        addToast(`Agent spawned: ${task.substring(0, 40)}`, 'success');
      } else {
        addToast(`Spawn failed: ${result.error || 'unknown'}`, 'error');
      }
    } catch (err: any) {
      addToast(`Spawn error: ${err.message}`, 'error');
    }
    setSpawning(false);
  }, [api, addToast]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const activeSession = sessions.find(s => s.id === selectedSession);
  const activeSessionIndex = activeSession ? sessions.indexOf(activeSession) : -1;

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
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
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
              onSelectSession={setSelectedSession}
              onSpawnAgent={() => setSpawnOpen(true)}
            />
          )}
        </main>
      </div>
      <StatusBar
        sessions={sessions}
        connected={connected}
        uptime={uptime}
      />

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => { setSelectedSession(id); setPaletteOpen(false); }}
        onToggleTheme={toggleTheme}
        onSpawnAgent={() => { setSpawnOpen(true); setPaletteOpen(false); }}
      />

      {/* Spawn Modal */}
      <SpawnModal
        open={spawnOpen}
        onClose={() => setSpawnOpen(false)}
        onSpawn={handleSpawn}
        spawning={spawning}
      />
    </div>
  );
}
