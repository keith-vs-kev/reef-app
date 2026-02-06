# AGENTS.md — reef-app

## Commands

```bash
npm run dev          # Vite renderer + Electron main (concurrently)
npm run build        # Build both renderer (Vite) and main (tsc)
npm run start        # Build + launch Electron
npm run typecheck    # Check both tsconfigs
```

## Project Structure

```
src/
├── main/                  # Electron main process (Node.js)
│   ├── main.ts            # Window creation, IPC handlers, reef-core HTTP client
│   └── preload.ts         # contextBridge — exposes `window.reef` API
├── renderer/              # React app (browser context)
│   ├── App.tsx            # Root — layout, theme, state orchestration
│   ├── main.tsx           # React entry point
│   ├── index.html         # HTML shell
│   ├── styles.css         # Tailwind + custom theme variables
│   ├── use-reef.ts        # Hook wrapping window.reef IPC calls
│   ├── reef-api.ts        # Direct HTTP client (WebSocket + REST)
│   ├── types.ts           # Renderer-specific types
│   ├── shared-types.ts    # Copied from reef-core (don't edit here)
│   └── components/
│       ├── TopBar.tsx      # App header with connection status + theme toggle
│       ├── Sidebar.tsx     # Session list with status indicators
│       ├── SessionView.tsx # Session detail — output, actions, streaming
│       ├── SpawnModal.tsx  # New session dialog (provider, model, task)
│       ├── StatusBar.tsx   # Bottom bar — stats, uptime
│       ├── CommandPalette.tsx  # Cmd+K quick actions
│       ├── ActivityFeed.tsx    # Real-time event log
│       ├── ToastContainer.tsx  # Notification toasts
│       └── Icons.tsx       # SVG icon components
```

## Architecture

### Main vs Renderer (Critical)

- **Main process** (`src/main/`): Node.js context. Has `fs`, `http`, etc. Communicates with reef-core via HTTP. Never import React here.
- **Renderer process** (`src/renderer/`): Browser context. React + Tailwind. NO Node.js APIs. Access reef-core only through `window.reef` (preload bridge).
- **IPC bridge** (`preload.ts`): `contextBridge.exposeInMainWorld('reef', {...})` — this is the ONLY way renderer talks to main.

### Adding New IPC Calls

1. Add handler in `main.ts`: `ipcMain.handle('reef:newThing', ...)`
2. Expose in `preload.ts`: add to `contextBridge` object
3. Add TypeScript typing in renderer `types.ts`
4. Use via `window.reef.newThing()` in renderer

## Theme System

- Dark/light mode via CSS class on `<html>` (`dark` or `light`)
- Theme state in `App.tsx`, toggled from `TopBar.tsx`
- CSS variables in `styles.css` define colors per theme
- Tailwind's `dark:` variant used throughout components
- Default: dark mode

## Code Style

- Components: PascalCase files (`SpawnModal.tsx`)
- Hooks: `use` prefix (`use-reef.ts`)
- TypeScript strict mode, no `any`
- Tailwind for all styling — no inline styles or CSS modules
- Prettier: single quotes, 2-space indent, semicolons

## Where to Put New Code

- New UI component? → `src/renderer/components/`
- New IPC call? → See "Adding New IPC Calls" above
- New shared type? → Edit in reef-core first, then copy `shared-types.ts`
- New hook? → `src/renderer/` with `use-` prefix

## Key Decisions

- **Vite over webpack**: Fast HMR, simple config
- **Raw HTTP in main process**: No axios/fetch deps, matches reef-core's style
- **No state management lib**: React state + hooks sufficient at current scale
- **Tailwind + hand-rolled components**: No shadcn/radix yet — keeping it simple

## Shared Types Sync

`reef-core/src/shared-types.ts` is the source of truth.
When types change in reef-core, manually copy to `src/renderer/shared-types.ts`.

## Gotchas

- reef-core must be running on :7777 for the app to connect
- `npm run dev` uses `concurrently` — renderer starts first, main waits 2s
- Two tsconfigs: `tsconfig.json` (renderer), `tsconfig.main.json` (main process)
- Preload script is built separately via `tsconfig.main.json`
