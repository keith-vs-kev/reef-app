import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ReefSession } from '../types';
import { useReefApi } from '../use-reef';

interface SessionViewProps {
  session: ReefSession;
  sessionIndex: number;
}

const AGENT_EMOJIS = ['🦖', '🔍', '🎨', '⚡', '🧪', '🐚', '🦀', '🌊', '🐙', '🦑'];

// ── Parse tmux output into structured blocks ──
interface OutputBlock {
  type: 'user' | 'assistant' | 'tool' | 'system' | 'raw';
  content: string;
  timestamp?: string;
}

function parseTmuxOutput(raw: string): OutputBlock[] {
  if (!raw || !raw.trim()) return [];

  const lines = raw.split('\n');
  const blocks: OutputBlock[] = [];
  let currentBlock: OutputBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock) currentBlock.content += '\n';
      continue;
    }

    // Detect Claude's prompt markers / human messages
    if (trimmed.startsWith('Human:') || trimmed.startsWith('❯') || trimmed.startsWith('>')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'user', content: trimmed.replace(/^(Human:|❯|>)\s*/, '') };
    }
    // Detect assistant output
    else if (trimmed.startsWith('Assistant:') || trimmed.startsWith('Claude:')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'assistant', content: trimmed.replace(/^(Assistant:|Claude:)\s*/, '') };
    }
    // Detect tool usage patterns
    else if (trimmed.match(/^(Read|Write|Edit|Bash|Search|Glob|LS|MultiTool|TodoRead|TodoWrite)\s*\(/i) ||
             trimmed.startsWith('⚡') || trimmed.startsWith('🔧')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'tool', content: trimmed };
    }
    // System messages
    else if (trimmed.startsWith('╭') || trimmed.startsWith('╰') || trimmed.startsWith('───')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'system', content: trimmed };
    }
    // Continue current block
    else if (currentBlock) {
      currentBlock.content += '\n' + line;
    }
    // Default: raw
    else {
      currentBlock = { type: 'raw', content: line };
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

// ── Status Pill ──
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dotClass: string }> = {
    running: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dotClass: 'status-dot-active' },
    stopped: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', dotClass: 'bg-zinc-600' },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', dotClass: 'bg-red-500' },
  };
  const c = config[status] || config.stopped;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dotClass}`} />
      {status}
    </span>
  );
}

// ── Block Renderer ──
function OutputBlockView({ block }: { block: OutputBlock }) {
  const [expanded, setExpanded] = useState(false);

  if (block.type === 'user') {
    return (
      <div className="message-enter flex justify-end mb-3">
        <div className="max-w-xl">
          <div
            className="rounded-2xl rounded-tr-md px-4 py-2.5 text-[13px] leading-relaxed border"
            style={{
              background: 'var(--reef-user-bubble)',
              borderColor: 'var(--reef-user-border)',
              color: 'var(--reef-text-bright)',
            }}
          >
            <div className="whitespace-pre-wrap break-words">{block.content.trim()}</div>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'assistant') {
    return (
      <div className="message-enter max-w-2xl mr-auto mb-3">
        <div
          className="rounded-2xl rounded-tl-md px-4 py-2.5 text-[13px] leading-relaxed border"
          style={{
            background: 'var(--reef-assistant-bubble)',
            borderColor: 'var(--reef-assistant-border)',
            color: 'var(--reef-text)',
          }}
        >
          <div className="whitespace-pre-wrap break-words">{block.content.trim()}</div>
        </div>
      </div>
    );
  }

  if (block.type === 'tool') {
    const short = block.content.length > 80 ? block.content.substring(0, 80) + '…' : block.content;
    return (
      <div className="message-enter max-w-2xl mr-auto mb-1">
        <div className="rounded-md border border-reef-border overflow-hidden" style={{ background: 'var(--reef-tool-bg)' }}>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs hover:bg-reef-border/20 transition-colors duration-150"
            onClick={() => setExpanded(!expanded)}
          >
            <svg
              className={`w-3 h-3 text-reef-text-dim transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="text-amber-400 font-mono text-[11px]">⚡ tool</span>
            {!expanded && <span className="text-reef-text-muted font-mono text-[10px] truncate flex-1">{short}</span>}
          </button>
          {expanded && (
            <div className="px-3 py-2 border-t border-reef-border">
              <pre className="text-[11px] font-mono text-reef-text-dim whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto">
                {block.content}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'system') {
    return (
      <div className="message-enter flex justify-center py-1">
        <span className="text-[10px] text-reef-text-muted italic max-w-md truncate">
          {block.content.substring(0, 120)}
        </span>
      </div>
    );
  }

  // raw
  return (
    <div className="message-enter max-w-2xl mr-auto mb-1">
      <pre className="text-[11px] font-mono text-reef-text-dim whitespace-pre-wrap px-2">{block.content}</pre>
    </div>
  );
}

// ── Main Session View ──
export function SessionView({ session, sessionIndex }: SessionViewProps) {
  const api = useReefApi();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [rawOutput, setRawOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chat' | 'raw'>('chat');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Poll for history
  useEffect(() => {
    let active = true;
    setLoading(true);
    setRawOutput('');

    async function poll() {
      if (!active) return;
      try {
        const result = await api.history(session.id, 1000);
        if (active && result.ok && result.data) {
          setRawOutput(result.data.output || '');
        }
      } catch {}
      setLoading(false);
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [session.id, api]);

  // Auto-scroll
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rawOutput, loading]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(dist > 200);
  }, []);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.send(session.id, input.trim());
      setInput('');
    } catch {}
    setSending(false);
  };

  const blocks = useMemo(() => parseTmuxOutput(rawOutput), [rawOutput]);

  const emoji = AGENT_EMOJIS[sessionIndex % AGENT_EMOJIS.length];

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--reef-bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-reef-border" style={{ background: 'var(--reef-bg-elevated)' }}>
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-semibold text-reef-text-bright">agent-{sessionIndex + 1}</span>
            <StatusPill status={session.status} />
          </div>
          <div className="text-[12px] text-reef-text-dim truncate max-w-lg mt-0.5">
            {session.task}
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-reef-border/30 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-3 py-1 text-[11px] rounded-md font-medium transition-all duration-150 ${
              viewMode === 'chat' ? 'bg-reef-accent text-white' : 'text-reef-text-dim hover:text-reef-text'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 text-[11px] rounded-md font-medium transition-all duration-150 ${
              viewMode === 'raw' ? 'bg-reef-accent text-white' : 'text-reef-text-dim hover:text-reef-text'
            }`}
          >
            Terminal
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        onScroll={onScroll}
      >
        {loading ? (
          <div className="p-5 space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <div className={`${i % 2 === 0 ? 'w-48' : 'w-72'}`}>
                  <div className="skeleton h-12 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : !rawOutput.trim() ? (
          <div className="flex items-center justify-center h-full text-reef-text-dim text-sm">
            <div className="text-center">
              <span className="text-4xl block mb-3">{emoji}</span>
              <p>Waiting for output...</p>
              <p className="text-[11px] text-reef-text-muted mt-1">Polling tmux every 2s</p>
            </div>
          </div>
        ) : viewMode === 'chat' ? (
          <div className="max-w-3xl mx-auto space-y-1">
            {blocks.map((block, i) => (
              <OutputBlockView key={i} block={block} />
            ))}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <pre className="text-[12px] font-mono text-reef-text leading-relaxed whitespace-pre-wrap break-words">
              {rawOutput}
            </pre>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-9 h-9 rounded-full bg-reef-bg-elevated border border-reef-border shadow-lg flex items-center justify-center text-reef-text-dim hover:text-reef-text-bright hover:border-reef-accent/50 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="m19 14-7 7m0 0-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Input */}
      {session.status === 'running' && (
        <div className="px-4 py-3 border-t border-reef-border" style={{ background: 'var(--reef-bg-elevated)' }}>
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Send a message to this agent..."
              disabled={sending}
              className="flex-1 h-10 px-4 text-sm bg-reef-bg border border-reef-border rounded-xl text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="h-10 px-4 rounded-xl bg-reef-accent text-white text-sm font-medium hover:bg-reef-accent-hover transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

