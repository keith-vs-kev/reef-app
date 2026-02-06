import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ReefSession } from '../types'
import { Search, Plus, Palette } from 'lucide-react'
import { ProviderIcon } from './Icons'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  sessions: ReefSession[]
  onSelectSession: (id: string) => void
  onToggleTheme: () => void
  onSpawnAgent: () => void
}

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: 'session' | 'action'
  action: () => void
}

export function CommandPalette({
  open,
  onClose,
  sessions,
  onSelectSession,
  onToggleTheme,
  onSpawnAgent,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      {
        id: 'spawn',
        label: 'New Agent',
        description: 'Spawn a new AI agent',
        icon: <Plus className="w-4 h-4 text-reef-accent" />,
        category: 'action',
        action: () => {
          onSpawnAgent()
          onClose()
        },
      },
      {
        id: 'theme',
        label: 'Toggle Theme',
        description: 'Switch dark/light',
        icon: <Palette className="w-4 h-4 text-reef-text-dim" />,
        category: 'action',
        action: () => {
          onToggleTheme()
          onClose()
        },
      },
    ]

    sessions.forEach((s, i) => {
      cmds.push({
        id: `session:${s.id}`,
        label: `agent-${i + 1}`,
        description: s.task,
        icon: <ProviderIcon provider={s.provider} className="w-4 h-4" />,
        category: 'session',
        action: () => {
          onSelectSession(s.id)
          onClose()
        },
      })
    })

    return cmds
  }, [sessions, onSelectSession, onToggleTheme, onSpawnAgent, onClose])

  const filtered = useMemo(() => {
    if (!query) return commands.slice(0, 20)
    const q = query.toLowerCase()
    return commands
      .filter(
        (c) => c.label.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [commands, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] palette-backdrop"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-reef-bg-elevated border border-reef-border rounded-xl shadow-2xl overflow-hidden palette-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-reef-border">
          <Search className="w-4 h-4 text-reef-text-dim shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search agents, commands..."
            className="flex-1 bg-transparent text-[13px] text-reef-text-bright placeholder-reef-text-dim focus:outline-none"
          />
          <kbd className="text-[11px] text-reef-text-muted bg-reef-border/50 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-reef-text-dim">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg cursor-pointer text-[13px] transition-colors duration-75 ${
                i === selectedIndex
                  ? 'bg-reef-accent-muted text-reef-text-bright'
                  : 'text-reef-text hover:bg-reef-border/30'
              }`}
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="w-6 flex items-center justify-center">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px]">{cmd.label}</div>
                {cmd.description && (
                  <div className="text-[11px] text-reef-text-dim truncate">{cmd.description}</div>
                )}
              </div>
              {cmd.category === 'session' && (
                <span className="text-[11px] text-reef-text-muted">session</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-reef-border text-[11px] text-reef-text-muted">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
