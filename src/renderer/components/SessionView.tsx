import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ReefSession } from '../types'
import { useReefApi } from '../use-reef'
import {
  ChevronRight,
  ChevronDown,
  ArrowDown,
  Square,
  Send,
  Loader2,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { ProviderIcon } from './Icons'

interface SessionViewProps {
  session: ReefSession
  sessionIndex: number
  wsOutput?: string[]
}

// ── Parse tmux output into structured blocks ──
interface OutputBlock {
  type: 'user' | 'assistant' | 'tool' | 'system' | 'raw'
  content: string
}

function parseTmuxOutput(raw: string): OutputBlock[] {
  if (!raw || !raw.trim()) return []

  const lines = raw.split('\n')
  const blocks: OutputBlock[] = []
  let currentBlock: OutputBlock | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentBlock) currentBlock.content += '\n'
      continue
    }

    if (trimmed.startsWith('Human:') || trimmed.startsWith('❯') || trimmed.startsWith('>')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'user', content: trimmed.replace(/^(Human:|❯|>)\s*/, '') }
    } else if (trimmed.startsWith('Assistant:') || trimmed.startsWith('Claude:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'assistant', content: trimmed.replace(/^(Assistant:|Claude:)\s*/, '') }
    } else if (
      trimmed.match(/^(Read|Write|Edit|Bash|Search|Glob|LS|MultiTool|TodoRead|TodoWrite)\s*\(/i) ||
      trimmed.startsWith('⚡') ||
      trimmed.startsWith('🔧')
    ) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'tool', content: trimmed }
    } else if (trimmed.startsWith('╭') || trimmed.startsWith('╰') || trimmed.startsWith('───')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'system', content: trimmed }
    } else if (currentBlock) {
      currentBlock.content += '\n' + line
    } else {
      currentBlock = { type: 'raw', content: line }
    }
  }

  if (currentBlock) blocks.push(currentBlock)
  return blocks
}

// ── Status Pill ──
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dotClass: string; label: string }> = {
    running: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dotClass: 'status-dot-active',
      label: 'Running',
    },
    stopped: {
      bg: 'bg-zinc-500/10',
      text: 'text-zinc-500',
      dotClass: 'bg-zinc-600',
      label: 'Stopped',
    },
    completed: {
      bg: 'bg-zinc-500/10',
      text: 'text-zinc-500',
      dotClass: 'bg-zinc-600',
      label: 'Completed',
    },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', dotClass: 'bg-red-500', label: 'Error' },
  }
  const c = config[status] || config.stopped
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dotClass}`} />
      {c.label}
    </span>
  )
}

// ── Kill Confirmation Modal ──
function KillConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-reef-bg-elevated border border-reef-border rounded-xl shadow-2xl p-5 max-w-sm w-full modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-[15px] font-semibold text-reef-text-bright">Kill Agent?</h3>
        </div>
        <p className="text-[13px] text-reef-text-dim mb-5">
          This will terminate the running agent session. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-10 px-4 rounded-lg text-[13px] text-reef-text-dim hover:text-reef-text hover:bg-reef-border/30 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[13px] font-medium hover:bg-red-500/20 transition-all duration-150"
          >
            Kill Agent
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Block Renderer ──
function OutputBlockView({ block }: { block: OutputBlock }) {
  const [expanded, setExpanded] = useState(false)

  if (block.type === 'user') {
    return (
      <div className="message-enter flex justify-end mb-3">
        <div className="max-w-xl">
          <div
            className="rounded-2xl rounded-tr-lg px-4 py-2.5 text-[13px] leading-relaxed border"
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
    )
  }

  if (block.type === 'assistant') {
    return (
      <div className="message-enter max-w-2xl mr-auto mb-3">
        <div
          className="rounded-2xl rounded-tl-lg px-4 py-2.5 text-[13px] leading-relaxed border"
          style={{
            background: 'var(--reef-assistant-bubble)',
            borderColor: 'var(--reef-assistant-border)',
            color: 'var(--reef-text)',
          }}
        >
          <div className="whitespace-pre-wrap break-words">{block.content.trim()}</div>
        </div>
      </div>
    )
  }

  if (block.type === 'tool') {
    const short = block.content.length > 80 ? block.content.substring(0, 80) + '…' : block.content
    return (
      <div className="message-enter max-w-2xl mr-auto mb-1">
        <div
          className="rounded-lg border border-reef-border overflow-hidden"
          style={{ background: 'var(--reef-tool-bg)' }}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-[13px] hover:bg-reef-border/20 transition-colors duration-150"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-reef-text-dim" />
            ) : (
              <ChevronRight className="w-3 h-3 text-reef-text-dim" />
            )}
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-mono text-[11px]">tool</span>
            {!expanded && (
              <span className="text-reef-text-muted font-mono text-[11px] truncate flex-1">
                {short}
              </span>
            )}
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
    )
  }

  if (block.type === 'system') {
    return (
      <div className="message-enter flex justify-center py-1">
        <span className="text-[11px] text-reef-text-muted italic max-w-md truncate">
          {block.content.substring(0, 120)}
        </span>
      </div>
    )
  }

  // raw
  return (
    <div className="message-enter max-w-2xl mr-auto mb-1">
      <pre className="text-[11px] font-mono text-reef-text-dim whitespace-pre-wrap px-2">
        {block.content}
      </pre>
    </div>
  )
}

// ── Main Session View ──
export function SessionView({ session, sessionIndex, wsOutput }: SessionViewProps) {
  const api = useReefApi()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [rawOutput, setRawOutput] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'chat' | 'raw'>('chat')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showKillConfirm, setShowKillConfirm] = useState(false)

  // Load initial output via HTTP, then use WS for real-time updates
  const httpLoadedRef = useRef(false)
  const [httpOutput, setHttpOutput] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setHttpOutput('')
    httpLoadedRef.current = false

    async function loadInitial() {
      if (!active) return
      try {
        const result = await api.history(session.id, 1000)
        if (active && result.ok && result.data) {
          setHttpOutput(result.data.output || '')
          httpLoadedRef.current = true
        }
      } catch {
        /* ignore */
      }
      setLoading(false)
    }

    loadInitial()
    return () => {
      active = false
    }
  }, [session.id, api])

  // Merge HTTP initial output + WS streaming output
  useEffect(() => {
    const wsText = wsOutput ? wsOutput.join('\n') : ''
    if (httpOutput && wsText) {
      // HTTP has the full history; WS has new lines since connect.
      // Use HTTP as base, WS output may partially overlap, so just use the longer one
      setRawOutput(wsText.length > httpOutput.length ? wsText : httpOutput)
    } else {
      setRawOutput(httpOutput || wsText)
    }
  }, [httpOutput, wsOutput])

  // Auto-scroll
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [rawOutput, loading])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(dist > 200)
  }, [])

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.send(session.id, input.trim())
      setInput('')
    } catch {
      /* ignore */
    }
    setSending(false)
  }

  const handleKill = async () => {
    setShowKillConfirm(false)
    try {
      await api.kill(session.id)
    } catch {
      /* ignore */
    }
  }

  const blocks = useMemo(() => parseTmuxOutput(rawOutput), [rawOutput])

  const prov = session.provider

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--reef-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-3 border-b border-reef-border"
        style={{ background: 'var(--reef-bg-elevated)' }}
      >
        <ProviderIcon provider={prov} className="w-7 h-7" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[15px] font-semibold text-reef-text-bright">
              agent-{sessionIndex + 1}
            </span>
            <StatusPill status={session.status} />
            {prov && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-reef-border bg-reef-border/20 text-reef-text-dim">
                {prov}
              </span>
            )}
            {session.model && (
              <span className="text-[11px] text-reef-text-muted bg-reef-border/30 px-2 py-0.5 rounded-full">
                {session.model}
              </span>
            )}
          </div>
          <div className="text-[13px] text-reef-text-dim mt-0.5 truncate">{session.task}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Kill button */}
          {session.status === 'running' && (
            <button
              onClick={() => setShowKillConfirm(true)}
              className="h-8 px-3 rounded-lg text-[13px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-150 flex items-center gap-1.5"
            >
              <Square className="w-3 h-3" />
              Kill
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-reef-border/30 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1.5 text-[13px] rounded-lg font-medium transition-all duration-150 ${
                viewMode === 'chat'
                  ? 'bg-reef-border text-reef-text-bright'
                  : 'text-reef-text-dim hover:text-reef-text'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 text-[13px] rounded-lg font-medium transition-all duration-150 ${
                viewMode === 'raw'
                  ? 'bg-reef-border text-reef-text-bright'
                  : 'text-reef-text-dim hover:text-reef-text'
              }`}
            >
              Terminal
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4" onScroll={onScroll}>
        {loading ? (
          <div className="p-5 space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <div className={`${i % 2 === 0 ? 'w-48' : 'w-72'}`}>
                  <div className="skeleton h-12 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : !rawOutput.trim() ? (
          <div className="flex items-center justify-center h-full text-reef-text-dim text-[13px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-reef-text-muted animate-spin mx-auto mb-3" />
              <p>Agent is starting up…</p>
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
            <pre className="text-[13px] font-mono text-reef-text leading-relaxed whitespace-pre-wrap break-words">
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
          className="absolute bottom-20 right-6 w-9 h-9 rounded-full bg-reef-bg-elevated border border-reef-border shadow-lg flex items-center justify-center text-reef-text-dim hover:text-reef-text-bright hover:border-reef-accent/50 transition-all duration-200"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      {session.status === 'running' && (
        <div
          className="px-4 py-3 border-t border-reef-border"
          style={{ background: 'var(--reef-bg-elevated)' }}
        >
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send a message to this agent..."
              disabled={sending}
              className="flex-1 h-10 px-4 text-[13px] bg-reef-bg border border-reef-border rounded-lg text-reef-text-bright placeholder-reef-text-dim focus:border-reef-accent focus:ring-1 focus:ring-reef-accent/20 focus:outline-none transition-all duration-150 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="h-10 px-4 rounded-lg bg-reef-accent text-white text-[13px] font-medium hover:bg-reef-accent-hover transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Kill confirmation modal */}
      {showKillConfirm && (
        <KillConfirmModal onConfirm={handleKill} onCancel={() => setShowKillConfirm(false)} />
      )}
    </div>
  )
}
