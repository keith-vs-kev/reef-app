import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('reef', {
  status: () => ipcRenderer.invoke('reef:status'),
  sessions: () => ipcRenderer.invoke('reef:sessions'),
  spawn: (
    task: string,
    opts?: { provider?: string; model?: string; workdir?: string; backend?: string }
  ) => ipcRenderer.invoke('reef:spawn', task, opts),
  history: (sessionId: string, lines?: number) =>
    ipcRenderer.invoke('reef:history', sessionId, lines),
  send: (sessionId: string, message: string) => ipcRenderer.invoke('reef:send', sessionId, message),
  kill: (sessionId: string) => ipcRenderer.invoke('reef:kill', sessionId),
})
