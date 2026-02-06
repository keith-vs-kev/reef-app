import React from 'react'
import { Bot, Cpu, Sparkles, Circle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface ProviderIconProps {
  provider?: string
  className?: string
}

/** SVG provider icon — distinct icon per provider */
export function ProviderIcon({ provider, className = 'w-4 h-4' }: ProviderIconProps) {
  switch (provider) {
    case 'anthropic':
      return <Sparkles className={`${className} text-purple-400`} />
    case 'openai':
      return <Cpu className={`${className} text-green-400`} />
    case 'google':
      return <Bot className={`${className} text-blue-400`} />
    default:
      return <Bot className={`${className} text-reef-text-dim`} />
  }
}

interface StatusIconProps {
  status: string
  className?: string
}

/** Status indicator dot/icon */
export function StatusIcon({ status, className = 'w-2 h-2' }: StatusIconProps) {
  if (status === 'running') {
    return <span className={`${className} rounded-full status-dot-active shrink-0`} />
  }
  if (status === 'error') {
    return <span className={`${className} rounded-full bg-red-500 shrink-0`} />
  }
  return <span className={`${className} rounded-full bg-zinc-600 shrink-0`} />
}

interface ProviderCardIconProps {
  provider: string
  className?: string
}

/** Larger provider icon for spawn modal cards */
export function ProviderCardIcon({ provider, className = 'w-8 h-8' }: ProviderCardIconProps) {
  switch (provider) {
    case 'anthropic':
      return <Sparkles className={`${className} text-purple-400`} />
    case 'openai':
      return <Cpu className={`${className} text-green-400`} />
    case 'google':
      return <Bot className={`${className} text-blue-400`} />
    default:
      return <Bot className={`${className} text-reef-text-dim`} />
  }
}

export { Circle, AlertCircle, CheckCircle2, Loader2 }
