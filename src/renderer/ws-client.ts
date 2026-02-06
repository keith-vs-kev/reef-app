/**
 * ws-client.ts — WebSocket client for real-time reef-core event streaming
 *
 * Connects to reef-core's WebSocket at ws://localhost:7777/ws
 * Provides auto-reconnect with exponential backoff.
 * Replaces HTTP polling for session list and output updates.
 */
import type { WsClientMessage, WsServerMessage, ReefEvent, SessionStatus } from './shared-types'

export type WsConnectionState = 'connecting' | 'connected' | 'disconnected'

export type WsEventHandler = (event: WsServerMessage) => void

interface WsClientOptions {
  url?: string
  onConnectionChange?: (state: WsConnectionState) => void
  onSessionNew?: (
    sessionId: string,
    data: { task: string; backend: string; provider?: string; model?: string }
  ) => void
  onSessionEnd?: (sessionId: string, data: { reason: string }) => void
  onOutput?: (
    sessionId: string,
    data: { text: string; streaming?: boolean; complete?: boolean; meta?: boolean }
  ) => void
  onStatusChange?: (sessionId: string, data: { status: SessionStatus; error?: string }) => void
  onToolStart?: (
    sessionId: string,
    data: { toolName: string; toolCallId: string; args?: unknown }
  ) => void
  onToolEnd?: (
    sessionId: string,
    data: { toolName: string; toolCallId: string; isError?: boolean }
  ) => void
}

const DEFAULT_URL = 'ws://localhost:7777/ws'
const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

export class ReefWsClient {
  private ws: WebSocket | null = null
  private url: string
  private opts: WsClientOptions
  private reconnectDelay = INITIAL_RECONNECT_DELAY
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionalClose = false
  private _state: WsConnectionState = 'disconnected'

  constructor(opts: WsClientOptions = {}) {
    this.url = opts.url || DEFAULT_URL
    this.opts = opts
  }

  get state(): WsConnectionState {
    return this._state
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    this.intentionalClose = false
    this.setState('connecting')

    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY
      this.setState('connected')
      // Subscribe to all events
      this.send({ type: 'subscribe_all' })
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage
        this.handleMessage(msg)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.ws = null
      this.setState('disconnected')
      if (!this.intentionalClose) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      // onclose will fire after this
    }
  }

  disconnect(): void {
    this.intentionalClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setState('disconnected')
  }

  sendMessage(sessionId: string, message: string): void {
    this.send({ type: 'send', sessionId, message })
  }

  private send(msg: WsClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private setState(state: WsConnectionState): void {
    if (this._state === state) return
    this._state = state
    this.opts.onConnectionChange?.(state)
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectDelay)
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY)
  }

  private handleMessage(msg: WsServerMessage): void {
    // Check if it's a ReefEvent (has sessionId + data)
    if (!('sessionId' in msg) || !('data' in msg)) return

    const event = msg as ReefEvent
    switch (event.type) {
      case 'session.new':
        this.opts.onSessionNew?.(event.sessionId, event.data)
        break
      case 'session.end':
        this.opts.onSessionEnd?.(event.sessionId, event.data)
        break
      case 'output':
        this.opts.onOutput?.(event.sessionId, event.data)
        break
      case 'status':
        this.opts.onStatusChange?.(event.sessionId, event.data)
        break
      case 'tool.start':
        this.opts.onToolStart?.(event.sessionId, event.data)
        break
      case 'tool.end':
        this.opts.onToolEnd?.(event.sessionId, event.data)
        break
    }
  }
}
