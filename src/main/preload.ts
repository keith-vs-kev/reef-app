import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('reef', {
  status: () => ipcRenderer.invoke('reef:status'),
  sessions: () => ipcRenderer.invoke('reef:sessions'),
  spawn: (task: string, model?: string) => ipcRenderer.invoke('reef:spawn', task, model),
  history: (sessionId: string, lines?: number) => ipcRenderer.invoke('reef:history', sessionId, lines),
  send: (sessionId: string, message: string) => ipcRenderer.invoke('reef:send', sessionId, message),
  kill: (sessionId: string) => ipcRenderer.invoke('reef:kill', sessionId),
});
