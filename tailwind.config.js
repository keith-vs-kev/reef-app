/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        reef: {
          bg: 'var(--reef-bg)',
          'bg-elevated': 'var(--reef-bg-elevated)',
          sidebar: 'var(--reef-sidebar)',
          border: 'var(--reef-border)',
          'border-subtle': 'var(--reef-border-subtle)',
          accent: 'var(--reef-accent)',
          'accent-hover': 'var(--reef-accent-hover)',
          'accent-muted': 'var(--reef-accent-muted)',
          text: 'var(--reef-text)',
          'text-bright': 'var(--reef-text-bright)',
          'text-dim': 'var(--reef-text-dim)',
          'text-muted': 'var(--reef-text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
