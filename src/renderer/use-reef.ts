/**
 * use-reef.ts — Unified API access that works both in Electron (IPC) and browser (HTTP)
 */
import { reefApi } from './reef-api'

function getApi() {
  if (window.reef) return window.reef
  return reefApi
}

export function useReefApi() {
  return getApi()
}
