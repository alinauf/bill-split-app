'use client'

import React, { useState } from 'react'
import { SlidersHorizontal, Trash2 } from 'lucide-react'
import Avatar from './Avatar'
import ItemEditor from './ItemEditor'
import { formatAmount, isEqualSplit, itemTotal, totalShares, type Item, type Person } from '@/lib/bill'

interface ItemRowProps {
  item: Item
  people: Person[]
  currency: string
  onToggle: (itemId: number, personId: number) => void
  onToggleAll: (itemId: number) => void
  onOpenSplit: (itemId: number) => void
  onUpdate: (itemId: number, changes: { name: string; price: number; quantity: number }) => void
  onRemove: (itemId: number) => void
}

export default function ItemRow({
  item,
  people,
  currency,
  onToggle,
  onToggleAll,
  onOpenSplit,
  onUpdate,
  onRemove,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false)
  const assigned = item.shares.filter((s) => people.some((p) => p.id === s.personId))
  const unassigned = assigned.length === 0
  const everyone = people.length > 0 && people.every((p) => assigned.some((s) => s.personId === p.id))
  const equal = isEqualSplit(item)
  const parts = totalShares(item)

  return (
    <div
      className={`py-2.5 border-b border-dashed border-gray-200 dark:border-gray-700 -mx-1 px-1 ${
        unassigned && people.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20 rounded-md' : ''
      }`}
    >
      {editing ? (
        <ItemEditor
          item={item}
          onSave={(changes) => {
            onUpdate(item.id, changes)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 min-w-0 text-left group"
            title="Tap to edit"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">
              {item.quantity > 1 && <span className="font-mono text-gray-500 dark:text-gray-400">{item.quantity}× </span>}
              {item.name}
            </span>
            {item.quantity > 1 && (
              <span className="ml-2 font-mono text-xs text-gray-400 dark:text-gray-500">@ {formatAmount(item.price, currency)}</span>
            )}
          </button>
          <span className="font-mono tabular-nums text-gray-900 dark:text-gray-100">{formatAmount(itemTotal(item), currency)}</span>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name}`}
            className="p-1 -mr-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        {people.length === 0 ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">Add people to assign this</span>
        ) : (
          <>
            {people.map((person) => {
              const on = assigned.some((s) => s.personId === person.id)
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onToggle(item.id, person.id)}
                  aria-pressed={on}
                  aria-label={`${on ? 'Remove' : 'Add'} ${person.name}`}
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Avatar person={person} size="sm" off={!on} />
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onToggleAll(item.id)}
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                everyone
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {everyone ? 'Everyone' : 'All'}
            </button>
            {assigned.length > 1 && (
              <button
                type="button"
                onClick={() => onOpenSplit(item.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  equal
                    ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}
              >
                <SlidersHorizontal size={11} />
                {equal ? 'Adjust' : assigned.map((s) => `${s.share}/${parts}`).join(' · ')}
              </button>
            )}
            {unassigned && (
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">← who had this?</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
