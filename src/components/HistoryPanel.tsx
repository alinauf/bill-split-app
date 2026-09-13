'use client'

import React from 'react'
import { formatCurrency } from '@/lib/bill'

export interface SplitHistoryEntry {
  id: string
  date: string
  currency: string
  people: { name: string; total: number }[]
  total: number
  breakdownText: string
}

interface HistoryPanelProps {
  history: SplitHistoryEntry[]
  onCopy: (text: string) => void
  onClear: () => void
}

export default function HistoryPanel({ history, onCopy, onClear }: HistoryPanelProps) {
  if (history.length === 0) return null
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent splits</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2">
        {history.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{entry.date}</span>
              <span className="font-mono font-medium text-sm text-gray-900 dark:text-gray-100">
                {formatCurrency(entry.total, entry.currency)}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {entry.people.map((p) => `${p.name}: ${formatCurrency(p.total, entry.currency)}`).join(', ')}
            </div>
            <button
              type="button"
              onClick={() => onCopy(entry.breakdownText)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Copy breakdown
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
