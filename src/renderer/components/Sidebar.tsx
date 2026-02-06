import React, { useState, useMemo } from 'react';
import { ReefSession } from '../types';

interface SidebarProps {
  sessions: ReefSession[];
  selectedSession: string | null;
  onSelectSession: (id: string) => void;
  onSpawnAgent: () => void;
  loading?: boolean;
}

const AGENT_EMOJIS = ['🦖', '🔍', '🎨', '⚡', '🧪', '🐚', '🦀', '🌊', '🐙', '🦑'];

const PROVIDER_BADGE: Record<string, { emoji: string; color: string }> = {
  anthropic: { emoji: '🟣', color: 'text-purple-400' },
  openai: { emoji: '🟢', color: 'text-green-400' },
  google: { emoji: '🔵', color: 'text-blue-400' },
};

function getEmoji(index: number): string {
  return AGENT_EMOJIS[index % AGENT_EMOJIS.length];
}

function statusDot(status: string): string {
  if (status === 'running') return 'status-dot-active';
  if (status === 'error') return 'bg-red-500';
  return 'bg-zinc-600';
}

function statusLabel(status: string): string {
  if (status === 'running') return 'active';
  if (status === 'stopped') return 'done';
  return status;
}

function statusColor(status: string): string {
  if (status === 'running') return 'text-emerald-400';
  if (status === 'error') return 'text-red-400';
  return 'text-reef-text-muted';
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncateTask(task: string, max: number = 40): string {
  if (task.length <= max) return task;
  return task.substring(0, max) + '…';
}

export function Sidebar({ sessions, selectedSession, onSelectSession, onSpawnAgent, loading }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [projectOpen, setProjectOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(s =>
      s.task.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const activeCount = sessions.filter(s => s.status === 'running').length;

  return (
    <div className="w-64 min-w-[220px] max-w-[340px] bg-reef-sidebar border-r border-reef-border flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-reef-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-7 pl-8 pr-3 text-xs bg-reef-bg border border-reef-border rounded-md text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150"
          />
        </div>
      </div>

      {/* New Agent button */}
      <div className="px-2 mb-1">
        <button
          onClick={onSpawnAgent}
          className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-reef-accent/10 text-reef-accent hover:bg-reef-accent/20 border border-reef-accent/20 text-xs font-medium transition-all duration-150"
        >
          <span className="text-sm">+</span>
          New Agent
        </button>
      </div>

      {/* Project tree */}
      <div className="flex-1 overflow-y-auto px-1">
        {loading ? (
          <div className="px-2 py-2 space-y-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <div className="skeleton w-2 h-2 rounded-full" />
                <div className="skeleton w-5 h-5 rounded" />
                <div className="flex-1"><div className="skeleton h-3 w-20" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-0.5">
            {/* Project header */}
            <button
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-reef-text hover:bg-reef-border/20 rounded-md transition-colors duration-150"
              onClick={() => setProjectOpen(!projectOpen)}
            >
              <span className="w-4 h-4 flex items-center justify-center text-reef-text-dim">
                <svg
                  className={`w-3 h-3 transition-transform duration-150 ${projectOpen ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
              <span className="text-sm">📁</span>
              <div className="flex-1 text-left">Default Project</div>
              {activeCount > 0 && (
                <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full font-medium">
                  {activeCount} active
                </span>
              )}
            </button>

            {/* Sessions */}
            {projectOpen && (
              <div className="relative ml-1">
                <div className="absolute top-0 bottom-0 border-l border-reef-border/30" style={{ left: '14px' }} />
                {filtered.length === 0 ? (
                  <div className="text-[11px] text-reef-text-dim text-center py-4">
                    {sessions.length === 0 ? 'No agents yet — spawn one!' : 'No matches'}
                  </div>
                ) : (
                  filtered.map((session, i) => {
                    const isSelected = selectedSession === session.id;
                    return (
                      <div
                        key={session.id}
                        className={`group flex items-center gap-1.5 py-1.5 mx-0.5 rounded-md cursor-pointer text-[11px] transition-all duration-150 ${
                          isSelected
                            ? 'bg-reef-accent-muted text-reef-text-bright ring-1 ring-reef-accent/20'
                            : 'hover:bg-reef-border/20 text-reef-text'
                        }`}
                        style={{ paddingLeft: '20px', paddingRight: '8px' }}
                        onClick={() => onSelectSession(session.id)}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(session.status)}`} />
                        <span className="text-xs shrink-0" title={session.provider || 'unknown'}>
                          {session.provider ? PROVIDER_BADGE[session.provider]?.emoji || getEmoji(i) : getEmoji(i)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium truncate">agent-{i + 1}</span>
                            <span className={`text-[8px] font-medium uppercase tracking-wide ${statusColor(session.status)}`}>
                              {statusLabel(session.status)}
                            </span>
                          </div>
                          <div className="truncate text-[10px] text-reef-text-dim leading-tight">
                            {truncateTask(session.task)}
                          </div>
                        </div>
                        <span className="text-[10px] text-reef-text-muted shrink-0">
                          {timeAgo(session.updated_at)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-reef-border">
        <div className="text-[10px] text-reef-text-dim text-center">
          {sessions.length} agent{sessions.length !== 1 ? 's' : ''} · 1 project
        </div>
      </div>
    </div>
  );
}
