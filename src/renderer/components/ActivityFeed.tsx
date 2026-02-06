import React from 'react'
import { ReefSession } from '../types'
import { Shell, ChevronRight, Rocket, WifiOff, RefreshCw } from 'lucide-react'
import { ProviderIcon } from './Icons'

interface ActivityFeedProps {
  sessions: ReefSession[]
  connected: boolean
  onSelectSession: (id: string) => void
  onSpawnAgent: () => void
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityFeed({
  sessions,
  connected,
  onSelectSession,
  onSpawnAgent,
}: ActivityFeedProps) {
  const active = sessions.filter((s) => s.status === 'running')
  const recent = sessions.filter((s) => s.status !== 'running').slice(0, 8)

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-lg px-6">
        {/* Hero */}
        <div className="text-center mb-10">
          <Shell className="w-14 h-14 text-reef-accent mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-semibold text-reef-text-bright tracking-tight mb-1">
            The Reef
          </h1>
          {connected ? (
            <p className="text-[13px] text-reef-text-dim">
              {sessions.length} agents · {active.length} active
            </p>
          ) : (
            <div className="mt-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-[13px] font-medium text-red-400">
                  Unable to connect to reef-core
                </span>
              </div>
              <p className="text-[11px] text-reef-text-dim mb-3">
                Check that reef-core is running on ws://localhost:7777
              </p>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-reef-text-dim hover:text-reef-text border border-reef-border hover:bg-reef-border/20 transition-all duration-150">
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
          {connected && (
            <p className="text-[11px] text-reef-text-muted mt-2">
              Press{' '}
              <kbd className="bg-reef-border/50 px-1.5 py-0.5 rounded font-mono text-[11px]">
                ⌘K
              </kbd>{' '}
              to search
            </p>
          )}
        </div>

        {/* Active agents */}
        {active.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-2 px-1">
              Active Now
            </h2>
            <div className="space-y-1">
              {active.map((s) => {
                const globalIndex = sessions.indexOf(s)
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-reef-border/20 hover:border-reef-border transition-all duration-150 text-left group"
                  >
                    <ProviderIcon provider={s.provider} className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-reef-text-bright">
                          agent-{globalIndex + 1}
                        </span>
                        <span className="w-2 h-2 rounded-full status-dot-active" />
                      </div>
                      <div className="text-[11px] text-reef-text-dim truncate">{s.task}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-reef-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Spawn button if no sessions */}
        {sessions.length === 0 && connected && (
          <div className="text-center">
            <button
              onClick={onSpawnAgent}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-reef-accent text-white text-[13px] font-medium hover:bg-reef-accent-hover transition-all duration-150"
            >
              <Rocket className="w-4 h-4" />
              Spawn Your First Agent
            </button>
          </div>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-2 px-1">
              Recent
            </h2>
            <div className="space-y-0.5">
              {recent.map((s) => {
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-reef-border/20 transition-colors duration-150 text-left"
                  >
                    <ProviderIcon provider={s.provider} className="w-4 h-4 opacity-60" />
                    <span className="text-[13px] text-reef-text-dim flex-1 truncate">{s.task}</span>
                    {s.status === 'error' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    <span className="text-[11px] text-reef-text-muted">
                      {timeAgo(s.updated_at)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
