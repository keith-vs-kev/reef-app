import React, { useState, useRef, useEffect } from 'react'

interface SpawnModalProps {
  open: boolean
  onClose: () => void
  onSpawn: (task: string, opts?: { provider?: string; model?: string; workdir?: string }) => void
  spawning: boolean
}

const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    emoji: '🟣',
    color: 'border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10',
    activeColor: 'border-purple-500 bg-purple-500/15 ring-1 ring-purple-500/30',
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    emoji: '🟢',
    color: 'border-green-500/40 bg-green-500/5 hover:bg-green-500/10',
    activeColor: 'border-green-500 bg-green-500/15 ring-1 ring-green-500/30',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'google',
    label: 'Google',
    emoji: '🔵',
    color: 'border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10',
    activeColor: 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/30',
    defaultModel: 'gemini-2.5-pro',
  },
]

export function SpawnModal({ open, onClose, onSpawn, spawning }: SpawnModalProps) {
  const [task, setTask] = useState('')
  const [provider, setProvider] = useState('anthropic')
  const [model, setModel] = useState('')
  const [workdir, setWorkdir] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTask('')
      setProvider('anthropic')
      setModel('')
      setWorkdir('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Cmd+N global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!
  const effectiveModel = model || selectedProvider.defaultModel

  const handleSubmit = () => {
    if (!task.trim() || spawning) return
    onSpawn(task.trim(), {
      provider,
      model: effectiveModel,
      workdir: workdir.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-reef-bg-elevated border border-reef-border rounded-xl shadow-2xl overflow-hidden modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-reef-border">
          <span className="text-2xl">🐚</span>
          <div>
            <h2 className="text-sm font-semibold text-reef-text-bright">Spawn New Agent</h2>
            <p className="text-[11px] text-reef-text-dim">
              Choose a provider and describe the task
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Provider selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-2">
              Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id)
                    setModel('')
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150 ${
                    provider === p.id ? p.activeColor : p.color
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-[11px] font-medium text-reef-text-bright">{p.label}</span>
                  <span className="text-[9px] text-reef-text-muted">{p.defaultModel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-1.5">
              Task
            </label>
            <textarea
              ref={inputRef}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              placeholder="What should this agent work on?"
              rows={3}
              className="w-full px-4 py-3 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150 resize-none"
            />
          </div>

          {/* Model (optional) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-1.5">
              Model{' '}
              <span className="text-reef-text-muted font-normal normal-case">
                (optional — defaults to {selectedProvider.defaultModel})
              </span>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={selectedProvider.defaultModel}
              className="w-full h-10 px-4 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150"
            />
          </div>

          {/* Working directory (optional) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-1.5">
              Working Directory{' '}
              <span className="text-reef-text-muted font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={workdir}
              onChange={(e) => setWorkdir(e.target.value)}
              placeholder="/home/adam/project"
              className="w-full h-10 px-4 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-reef-border">
          <span className="text-[10px] text-reef-text-muted">⌘+Enter to submit</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-sm text-reef-text-dim hover:text-reef-text hover:bg-reef-border/30 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!task.trim() || spawning}
              className="h-9 px-5 rounded-lg bg-reef-accent text-white text-sm font-medium hover:bg-reef-accent-hover transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {spawning ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Spawning...
                </>
              ) : (
                <>🐚 Spawn Agent</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
