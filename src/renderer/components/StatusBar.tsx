import React from 'react';
import { ReefSession } from '../types';

interface StatusBarProps {
  sessions: ReefSession[];
  connected: boolean;
  uptime?: number;
}

export function StatusBar({ sessions, connected, uptime }: StatusBarProps) {
  const active = sessions.filter(s => s.status === 'running').length;
  const total = sessions.length;

  return (
    <div className="flex items-center h-7 px-3 bg-reef-bg-elevated border-t border-reef-border text-[11px] gap-1 shrink-0 select-none">
      {/* Connection */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-reef-text-dim font-medium">
          {connected ? 'reef-core' : 'disconnected'}
        </span>
      </div>

      {/* Active */}
      {active > 0 && (
        <div className="flex items-center gap-1 px-2 py-0.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">{active} active</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Uptime */}
      {uptime !== undefined && (
        <>
          <div className="flex items-center gap-1 px-2 py-0.5 text-reef-text-dim">
            <span>uptime</span>
            <span className="font-mono">{Math.floor(uptime / 60)}m</span>
          </div>
          <span className="text-reef-border">·</span>
        </>
      )}

      {/* Total sessions */}
      <div className="flex items-center gap-1 px-2 py-0.5 text-reef-text-dim">
        <span className="font-mono">{total}</span>
        <span>agent{total !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
