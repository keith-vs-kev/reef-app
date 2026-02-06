import React from 'react';

interface TopBarProps {
  connected: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPalette: () => void;
}

export function TopBar({ connected, theme, onToggleTheme, onOpenPalette }: TopBarProps) {
  return (
    <div className="flex items-center h-12 px-4 bg-reef-sidebar border-b border-reef-border drag-region">
      {/* App branding */}
      <div className="flex items-center gap-2.5 mr-6 no-drag">
        <span className="text-xl">🐚</span>
        <span className="text-sm font-semibold text-reef-text-bright tracking-tight">
          The Reef
        </span>
        <span className="text-[10px] text-reef-text-muted font-mono bg-reef-border/40 px-1.5 py-0.5 rounded">
          reef-core
        </span>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-1.5 no-drag">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
        <span className="text-xs text-reef-text-dim">
          {connected ? 'Connected to reef-core' : 'Disconnected'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Command palette trigger */}
      <button
        onClick={onOpenPalette}
        className="no-drag h-8 px-3 mr-2 flex items-center gap-2 rounded-lg border border-reef-border hover:border-reef-accent/30 hover:bg-reef-border/20 text-reef-text-dim hover:text-reef-text transition-all duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <span className="text-xs">Search</span>
        <kbd className="text-[10px] bg-reef-border/50 px-1.5 py-0.5 rounded font-mono ml-1">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="no-drag w-8 h-8 flex items-center justify-center rounded-lg hover:bg-reef-border/50 text-reef-text-dim hover:text-reef-text-bright transition-colors duration-150"
      >
        <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
    </div>
  );
}
