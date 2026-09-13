'use client'

import React from 'react'
import { Copy, Download, Share2 } from 'lucide-react'
import { ColorDot } from './NameChip'
import {
  convertCurrency,
  formatCurrency,
  isEqualSplit,
  itemTotal,
  personColor,
  personFraction,
  personItems,
  settlement,
  totalShares,
  type Item,
  type Person,
  type Shares,
} from '@/lib/bill'

interface SettleUpProps {
  people: Person[]
  items: Item[]
  shares: Shares
  paidBy: number | null
  onChangePaidBy: (personId: number | null) => void
  currency: string
  convertToCurrency: string
  customRate: string
  canShare: boolean
  onCopy: () => void
  onExport: () => void
  onCopyLine: (text: string) => void
  receipt?: boolean
}

export default function SettleUp({
  people,
  items,
  shares,
  paidBy,
  onChangePaidBy,
  currency,
  convertToCurrency,
  customRate,
  canShare,
  onCopy,
  onExport,
  onCopyLine,
  receipt = false,
}: SettleUpProps) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const converting = !!convertToCurrency && convertToCurrency !== currency
  const conv = (n: number) => formatCurrency(convertCurrency(n, currency, convertToCurrency, customRate), convertToCurrency)
  const transfers = settlement(people, shares, paidBy)
  const barTotal = shares.assignedTotal > 0 ? shares.assignedTotal : 1
  const amount = 'font-mono tabular-nums'

  return (
    <div className={receipt ? '' : 'rounded-xl bg-green-50/70 dark:bg-green-900/15 p-4'}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className={`font-semibold ${receipt ? 'text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400' : 'text-base text-gray-900 dark:text-gray-100'}`}>
          Each pays
        </h2>
        {people.length > 0 && (
          <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            Paid by
            <select
              id="paid-by"
              value={paidBy ?? ''}
              onChange={(e) => onChangePaidBy(e.target.value ? Number(e.target.value) : null)}
              className="text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">nobody yet</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Add people to see what each person owes.</p>
      ) : (
        <>
          {shares.assignedTotal > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700 mb-3">
              {people.map((p) => (
                <span
                  key={p.id}
                  className={personColor(p).bg}
                  style={{ width: `${((shares.byPerson.get(p.id) || 0) / barTotal) * 100}%` }}
                  title={p.name}
                />
              ))}
            </div>
          )}
          <div className="space-y-2">
            {people.map((person) => {
              const total = shares.byPerson.get(person.id) || 0
              const mine = personItems(items, person.id)
              return (
                <div
                  key={person.id}
                  className={`rounded-lg ${receipt ? 'py-1' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ColorDot person={person} />
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{person.name}</span>
                      {paidBy === person.id && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                          paid
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`${amount} font-semibold text-gray-900 dark:text-gray-100`}>{fmt(total)}</div>
                      {converting && <div className={`${amount} text-xs text-gray-500 dark:text-gray-400`}>{conv(total)}</div>}
                    </div>
                  </div>
                  {mine.length > 0 && (
                    <ul className="mt-1 pl-8 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {mine.map((item) => {
                        const fraction = personFraction(item, person.id)
                        const share = item.shares.find((s) => s.personId === person.id)
                        const label =
                          item.shares.length > 1
                            ? isEqualSplit(item)
                              ? `÷ ${item.shares.length}`
                              : `${share?.share}/${totalShares(item)}`
                            : ''
                        return (
                          <li key={item.id} className="flex justify-between gap-2">
                            <span className="truncate">
                              {item.quantity > 1 && `${item.quantity}× `}
                              {item.name} {label && <span className="text-gray-400 dark:text-gray-500">{label}</span>}
                            </span>
                            <span className={amount}>{fmt(itemTotal(item) * fraction)}</span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          {shares.assignedTotal > 0 && shares.unassignedAmount <= 0.005 && (
            <p className="mt-2 text-xs text-green-700 dark:text-green-400">Shares add up to the bill total ✓</p>
          )}

          {transfers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-2">Settle up</h3>
              <div className="space-y-1.5">
                {transfers.map((t) => {
                  const text = `${t.from.name} pays ${t.to.name} ${fmt(t.amount)}${converting ? ` (${conv(t.amount)})` : ''}`
                  return (
                    <div
                      key={t.from.id}
                      className="flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                    >
                      <ColorDot person={t.from} />
                      <span className="flex-1 min-w-0 truncate text-gray-800 dark:text-gray-200">
                        <span className="font-medium">{t.from.name}</span> → {t.to.name}
                      </span>
                      <span className={`${amount} font-semibold text-gray-900 dark:text-gray-100`}>{fmt(t.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onCopyLine(text)}
                        aria-label={`Copy: ${text}`}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCopy}
          disabled={!canShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Share2 size={16} /> Copy breakdown
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!canShare}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 dark:bg-gray-700 text-white font-medium hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  )
}
