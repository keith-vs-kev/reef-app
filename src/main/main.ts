import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as http from 'http'

let mainWindow: BrowserWindow | null = null

const REEF_CORE_URL = process.env.REEF_CORE_URL || 'http://localhost:7777'

// ── HTTP helper for reef-core API ──
function reefApi(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, REEF_CORE_URL)
    const opts: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    }

    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', (c) => {
        data += c
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve({ raw: data })
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })

    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const isDev = process.env.VITE_DEV_SERVER_URL
  if (isDev) {
    mainWindow.loadURL(isDev)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupIPC() {
  // Health check
  ipcMain.handle('reef:status', async () => {
    try {
      const data = await reefApi('GET', '/status')
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // List sessions
  ipcMain.handle('reef:sessions', async () => {
    try {
      const data = await reefApi('GET', '/sessions')
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // Spawn new session
  ipcMain.handle(
    'reef:spawn',
    async (
      _event,
      task: string,
      opts?: { provider?: string; model?: string; workdir?: string; backend?: string }
    ) => {
      try {
        const body: any = { task, ...opts }
        const data = await reefApi('POST', '/sessions', body)
        return { ok: true, data }
      } catch (err: any) {
        return { ok: false, error: err.message }
      }
    }
  )

  // Get session history (tmux output)
  ipcMain.handle('reef:history', async (_event, sessionId: string, _lines?: number) => {
    try {
      const data = await reefApi('GET', `/sessions/${sessionId}/output`)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // Send message to session
  ipcMain.handle('reef:send', async (_event, sessionId: string, message: string) => {
    try {
      const data = await reefApi('POST', `/sessions/${sessionId}/send`, { message })
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  // Kill session
  ipcMain.handle('reef:kill', async (_event, sessionId: string) => {
    try {
      const data = await reefApi('DELETE', `/sessions/${sessionId}`)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}

app.whenReady().then(() => {
  setupIPC()
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
