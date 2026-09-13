'use client'

import { Check } from 'lucide-react'

export interface ToastState {
  message: string
  actionLabel?: string
  onAction?: () => void
  kind?: 'success' | 'info'
}

export default function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null
  return (
    <div
      role="status"
      className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 pl-4 pr-2 py-2 rounded-full shadow-lg z-[60] flex items-center gap-3 animate-fade-in max-w-[calc(100vw-2rem)]"
    >
      {toast.kind === 'success' && <Check className="w-4 h-4 text-green-400 dark:text-green-600 flex-shrink-0" />}
      <span className="text-sm font-medium truncate">{toast.message}</span>
      {toast.actionLabel && toast.onAction ? (
        <button
          type="button"
          onClick={toast.onAction}
          className="text-sm font-semibold text-blue-300 dark:text-blue-700 px-2 py-0.5 rounded-full hover:bg-white/10 dark:hover:bg-black/10"
        >
          {toast.actionLabel}
        </button>
      ) : (
        <span className="w-2" />
      )}
    </div>
  )
}
