import React, { useState, useRef, useEffect } from 'react';

interface SpawnModalProps {
  open: boolean;
  onClose: () => void;
  onSpawn: (task: string, model?: string) => void;
  spawning: boolean;
}

const MODELS = [
  { value: '', label: 'Default (Claude Code)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
];

export function SpawnModal({ open, onClose, onSpawn, spawning }: SpawnModalProps) {
  const [task, setTask] = useState('');
  const [model, setModel] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTask('');
      setModel('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!task.trim() || spawning) return;
    onSpawn(task.trim(), model || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center palette-backdrop"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-reef-bg-elevated border border-reef-border rounded-xl shadow-2xl overflow-hidden modal-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-reef-border">
          <span className="text-2xl">🦖</span>
          <div>
            <h2 className="text-sm font-semibold text-reef-text-bright">Spawn New Agent</h2>
            <p className="text-[11px] text-reef-text-dim">Starts a Pi agent in tmux via reef-core</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Task */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-1.5">
              Task
            </label>
            <textarea
              ref={inputRef}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="What should this agent work on?"
              rows={3}
              className="w-full px-4 py-3 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150 resize-none"
            />
          </div>

          {/* Model selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-reef-text-dim mb-1.5">
              Model
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full h-10 px-4 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
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
                <>🦖 Spawn Agent</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
