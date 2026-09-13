'use client'

import { ArrowDown, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/bill'

interface StickyBarProps {
  total: number
  unassignedAmount: number
  currency: string
  canShare: boolean
  onShare: () => void
  onJump: () => void
}

export default function StickyBar({ total, unassignedAmount, currency, canShare, onShare, onJump }: StickyBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <button type="button" onClick={onJump} className="flex-1 min-w-0 text-left">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1">
            Total <ArrowDown size={11} />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono font-semibold text-lg text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(total, currency)}
            </span>
            {unassignedAmount > 0.005 && (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                {formatCurrency(unassignedAmount, currency)} unassigned
              </span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={!canShare}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  )
}
