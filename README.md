# The Reef 🐚

Mission control for reef-core AI agents. Electron + React + TypeScript + Tailwind.

## Quick Start

```bash
# 1. Start reef-core
cd /path/to/reef-core && npx tsx index.ts

# 2. Start the app
npm install
npm run dev
```

## Architecture

- **reef-core** (port 7777): Spawns Claude Code agents in tmux sessions
- **reef-app** (this): Electron UI that talks to reef-core via HTTP API
- No WebSocket, no gateway — direct HTTP polling for simplicity

## Tech Stack

- Electron 28 + React 18 + TypeScript + Tailwind + Vite
- xterm.js for raw terminal fallback
- Shadcn dark theme (#09090b), ocean teal accent (#0ea5e9)
- Inter/JetBrains Mono fonts
