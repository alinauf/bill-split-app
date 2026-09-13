'use client'

import { Camera, PencilLine, Receipt } from 'lucide-react'

interface EmptyStateProps {
  onScan: () => void
  onType: () => void
}

export default function EmptyState({ onScan, onType }: EmptyStateProps) {
  return (
    <div className="text-center px-6 py-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
      <Receipt className="w-9 h-9 mx-auto text-blue-600 dark:text-blue-400" />
      <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Start a new bill</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
        Scan the receipt or type the items. Add people whenever you like, then tap who had what.
      </p>
      <div className="mt-5 grid gap-2 max-w-xs mx-auto">
        <button
          type="button"
          onClick={onScan}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <Camera size={18} /> Scan receipt
        </button>
        <button
          type="button"
          onClick={onType}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <PencilLine size={18} /> Type items
        </button>
      </div>
    </div>
  )
}
