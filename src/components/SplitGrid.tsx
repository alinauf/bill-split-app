'use client'

import React, { useState } from 'react'
import { Check, SlidersHorizontal, Trash2 } from 'lucide-react'
import NameChip from './NameChip'
import ItemEditor from './ItemEditor'
import {
  formatAmount,
  formatCurrency,
  itemTotal,
  personColor,
  totalShares,
  type Item,
  type Person,
  type Shares,
} from '@/lib/bill'

interface SplitGridProps {
  items: Item[]
  people: Person[]
  shares: Shares
  total: number
  currency: string
  onToggle: (itemId: number, personId: number) => void
  onToggleAll: (itemId: number) => void
  onOpenSplit: (itemId: number) => void
  onUpdate: (itemId: number, changes: { name: string; price: number; quantity: number }) => void
  onRemove: (itemId: number) => void
}

export default function SplitGrid({
  items,
  people,
  shares,
  total,
  currency,
  onToggle,
  onToggleAll,
  onOpenSplit,
  onUpdate,
  onRemove,
}: SplitGridProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const th = 'px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left'
  const td = 'px-2 py-2 align-middle'

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className={th}>Item</th>
            <th className={`${th} text-right`}>Total</th>
            {people.map((p) => (
              <th key={p.id} className={`${th} text-center`}>
                <NameChip person={p} size="sm" className="normal-case tracking-normal max-w-[6rem]" />
              </th>
            ))}
            <th className={`${th} text-center`}>All</th>
            <th className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const assigned = item.shares.filter((s) => people.some((p) => p.id === s.personId))
            const unassigned = assigned.length === 0 && people.length > 0
            const everyone = people.length > 0 && people.every((p) => assigned.some((s) => s.personId === p.id))
            const parts = totalShares(item)
            const equal = assigned.every((s) => s.share === assigned[0]?.share)
            return (
              <tr
                key={item.id}
                className={`border-t border-gray-200 dark:border-gray-700 ${
                  unassigned ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-900'
                }`}
              >
                <td className={`${td} min-w-[10rem] pl-3`}>
                  {editingId === item.id ? (
                    <ItemEditor
                      item={item}
                      onSave={(changes) => {
                        onUpdate(item.id, changes)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="text-left group"
                      title="Click to edit"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {item.quantity} × {formatAmount(item.price, currency)}
                        {unassigned && <span className="ml-2 font-sans font-medium text-amber-700 dark:text-amber-300">⚠ unassigned</span>}
                      </div>
                    </button>
                  )}
                </td>
                <td className={`${td} text-right font-mono tabular-nums text-gray-900 dark:text-gray-100`}>{formatAmount(itemTotal(item), currency)}</td>
                {people.map((p) => {
                  const share = assigned.find((s) => s.personId === p.id)
                  const color = personColor(p)
                  return (
                    <td key={p.id} className={`${td} text-center`}>
                      <button
                        type="button"
                        onClick={() => onToggle(item.id, p.id)}
                        aria-pressed={!!share}
                        aria-label={`${share ? 'Remove' : 'Add'} ${p.name} on ${item.name}`}
                        className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          share
                            ? `${color.bg} text-white`
                            : 'border border-dashed border-gray-300 dark:border-gray-600 text-transparent hover:border-gray-400'
                        }`}
                      >
                        {share ? (equal ? <Check size={14} /> : `${share.share}/${parts}`) : '·'}
                      </button>
                    </td>
                  )
                })}
                <td className={`${td} text-center`}>
                  <button
                    type="button"
                    onClick={() => onToggleAll(item.id)}
                    disabled={people.length === 0}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors disabled:opacity-40 ${
                      everyone
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {everyone ? '✓' : 'All'}
                  </button>
                </td>
                <td className={`${td} text-right whitespace-nowrap pl-1`}>
                  {assigned.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onOpenSplit(item.id)}
                      aria-label={`Adjust split for ${item.name}`}
                      title="Adjust split"
                      className={`p-1.5 rounded-md ${equal ? 'text-gray-400 hover:text-blue-600' : 'text-blue-600 dark:text-blue-400'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      <SlidersHorizontal size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td colSpan={people.length + 4} className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No items yet. Add one below or scan the receipt.
              </td>
            </tr>
          )}
        </tbody>
        {items.length > 0 && (
          <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
            <tr>
              <td className={`${td} font-semibold text-gray-900 dark:text-gray-100`}>Each pays</td>
              <td className={`${td} text-right font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-100 whitespace-nowrap`}>{formatAmount(total, currency)}</td>
              {people.map((p) => (
                <td key={p.id} className={`${td} text-center font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-100`}>
                  {formatAmount(shares.byPerson.get(p.id) || 0, currency)}
                </td>
              ))}
              <td className={td} colSpan={2}>
                {shares.unassignedAmount > 0.005 && (
                  <span className="block text-xs font-medium text-amber-700 dark:text-amber-300 leading-tight">
                    {formatCurrency(shares.unassignedAmount, currency)}
                    <br />
                    unassigned
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
