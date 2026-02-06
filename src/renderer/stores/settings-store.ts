import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  theme: 'dark' | 'light'
  reefCoreUrl: string
  sidebarCollapsed: boolean

  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setReefCoreUrl: (url: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      reefCoreUrl: 'http://localhost:7777',
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setReefCoreUrl: (reefCoreUrl) => set({ reefCoreUrl }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'reef-settings' }
  )
)
