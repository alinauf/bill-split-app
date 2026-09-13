'use client'

import React, { useEffect } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import {
  formatCurrency,
  itemTotal,
  personColor,
  totalShares,
  type Item,
  type Person,
} from '@/lib/bill'

interface SplitSheetProps {
  item: Item | null
  people: Person[]
  currency: string
  onToggle: (itemId: number, personId: number) => void
  onUpdateShare: (itemId: number, personId: number, share: number) => void
  onResetEqual: (itemId: number) => void
  onClose: () => void
}

export default function SplitSheet({
  item,
  people,
  currency,
  onToggle,
  onUpdateShare,
  onResetEqual,
  onClose,
}: SplitSheetProps) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, onClose])

  if (!item) return null

  const total = itemTotal(item)
  const parts = totalShares(item)
  const included = item.shares.filter((s) => people.some((p) => p.id === s.personId))
  const equal = included.every((s) => s.share === included[0]?.share)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={`Split ${item.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-3 sm:hidden" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Split {item.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{formatCurrency(total, currency)}</p>
          </div>
          <div className="flex items-center gap-1">
            {!equal && (
              <button
                type="button"
                onClick={() => onResetEqual(item.id)}
                className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Reset equal
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {people.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Add people first, then tap who had this.</p>
        ) : (
          <div className="space-y-2">
            {people.map((person) => {
              const share = item.shares.find((s) => s.personId === person.id)
              const amount = share && parts > 0 ? (total * share.share) / parts : 0
              return (
                <div key={person.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggle(item.id, person.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    aria-pressed={!!share}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex-shrink-0 inline-flex items-center justify-center ${
                        share ? personColor(person).bg : 'border border-dashed border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {share && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span className={`truncate ${share ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      {person.name}
                    </span>
                  </button>
                  {share ? (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Fewer parts for ${person.name}`}
                          onClick={() => onUpdateShare(item.id, person.id, Math.max(1, share.share - 1))}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-semibold tabular-nums text-gray-900 dark:text-gray-100">{share.share}</span>
                        <button
                          type="button"
                          aria-label={`More parts for ${person.name}`}
                          onClick={() => onUpdateShare(item.id, person.id, share.share + 1)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="w-20 text-right font-mono text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                        {formatCurrency(amount, currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">not included</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {included.length > 0 && parts > 0 && (
          <div className="mt-4">
            <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
              {included.map((s) => {
                const person = people.find((p) => p.id === s.personId)!
                return (
                  <span
                    key={s.personId}
                    className={personColor(person).bg}
                    style={{ width: `${(s.share / parts) * 100}%` }}
                  />
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {included
                .map((s) => `${people.find((p) => p.id === s.personId)?.name} ${s.share} ${s.share === 1 ? 'part' : 'parts'}`)
                .join(' · ')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
