import React, { useState, useMemo } from 'react'
import { ReefSession } from '../types'
import { Search, Plus, ChevronRight, FolderOpen } from 'lucide-react'
import { ProviderIcon, StatusIcon } from './Icons'

interface SidebarProps {
  sessions: ReefSession[]
  selectedSession: string | null
  onSelectSession: (id: string) => void
  onSpawnAgent: () => void
  loading?: boolean
}

function statusLabel(status: string): string {
  if (status === 'running') return 'active'
  if (status === 'stopped') return 'done'
  return status
}

function statusColor(status: string): string {
  if (status === 'running') return 'text-emerald-400'
  if (status === 'error') return 'text-red-400'
  return 'text-reef-text-muted'
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

function truncateTask(task: string, max: number = 40): string {
  if (task.length <= max) return task
  return task.substring(0, max) + '…'
}

export function Sidebar({
  sessions,
  selectedSession,
  onSelectSession,
  onSpawnAgent,
  loading,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [projectOpen, setProjectOpen] = useState(true)

  const filtered = useMemo(() => {
    if (!search) return sessions
    const q = search.toLowerCase()
    return sessions.filter(
      (s) =>
        s.task.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    )
  }, [sessions, search])

  const activeCount = sessions.filter((s) => s.status === 'running').length

  return (
    <div className="w-64 min-w-[220px] max-w-[340px] bg-reef-sidebar border-r border-reef-border flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-reef-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-reef-bg border border-reef-border rounded-lg text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150"
          />
        </div>
      </div>

      {/* New Agent button */}
      <div className="px-2.5 mb-2">
        <button
          onClick={onSpawnAgent}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-reef-accent/10 text-reef-accent hover:bg-reef-accent/20 border border-reef-accent/20 text-xs font-medium transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          New Agent
        </button>
      </div>

      {/* Project tree */}
      <div className="flex-1 overflow-y-auto px-1.5">
        {loading ? (
          <div className="px-2 py-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-2.5">
                <div className="skeleton w-2.5 h-2.5 rounded-full" />
                <div className="skeleton w-5 h-5 rounded" />
                <div className="flex-1">
                  <div className="skeleton h-3.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-0.5">
            {/* Project header */}
            <button
              className="w-full flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-reef-text hover:bg-reef-border/20 rounded-lg transition-colors duration-150"
              onClick={() => setProjectOpen(!projectOpen)}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 text-reef-text-dim transition-transform duration-150 ${projectOpen ? 'rotate-90' : ''}`}
              />
              <FolderOpen className="w-4 h-4 text-reef-text-dim" />
              <div className="flex-1 text-left">Default Project</div>
              {activeCount > 0 && (
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full font-medium">
                  {activeCount} active
                </span>
              )}
            </button>

            {/* Sessions */}
            {projectOpen && (
              <div className="relative ml-1">
                <div className="absolute top-0 bottom-0 left-[14px] border-l border-reef-border/30" />
                {filtered.length === 0 ? (
                  <div className="text-xs text-reef-text-dim text-center py-6">
                    {sessions.length === 0 ? 'No agents yet — spawn one!' : 'No matches'}
                  </div>
                ) : (
                  filtered.map((session, i) => {
                    const isSelected = selectedSession === session.id
                    return (
                      <div
                        key={session.id}
                        className={`group flex items-center gap-2 py-2.5 pl-5 pr-2 mx-0.5 rounded-lg cursor-pointer text-xs transition-all duration-150 ${
                          isSelected
                            ? 'bg-reef-accent-muted text-reef-text-bright ring-1 ring-reef-accent/20'
                            : 'hover:bg-reef-border/20 text-reef-text'
                        }`}
                        onClick={() => onSelectSession(session.id)}
                      >
                        <StatusIcon status={session.status} className="w-2 h-2 shrink-0" />
                        <ProviderIcon provider={session.provider} className="w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate text-[13px]">agent-{i + 1}</span>
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide ${statusColor(session.status)}`}
                            >
                              {statusLabel(session.status)}
                            </span>
                          </div>
                          <div className="truncate text-[11px] text-reef-text-dim leading-snug mt-0.5">
                            {truncateTask(session.task)}
                          </div>
                        </div>
                        <span className="text-[10px] text-reef-text-muted shrink-0">
                          {timeAgo(session.updated_at)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-reef-border">
        <div className="text-[11px] text-reef-text-dim text-center">
          {sessions.length} agent{sessions.length !== 1 ? 's' : ''} · 1 project
        </div>
      </div>
    </div>
  )
}
