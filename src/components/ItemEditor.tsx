'use client'

import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Item } from '@/lib/bill'

interface ItemEditorProps {
  item: Item
  onSave: (changes: { name: string; price: number; quantity: number }) => void
  onCancel: () => void
}

const inputClass =
  'px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function ItemEditor({ item, onSave, onCancel }: ItemEditorProps) {
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(String(item.price))
  const [quantity, setQuantity] = useState(String(item.quantity))

  const save = () => {
    const parsedPrice = parseFloat(price)
    const parsedQty = parseInt(quantity, 10)
    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) return
    onSave({
      name: name.trim(),
      price: parsedPrice,
      quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1,
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="flex flex-wrap items-center gap-2 py-1"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Item name"
        className={`${inputClass} flex-1 min-w-[8rem]`}
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        inputMode="numeric"
        aria-label="Quantity"
        className={`${inputClass} w-14 text-center`}
      />
      <span className="text-gray-400">×</span>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="decimal"
        aria-label="Unit price"
        className={`${inputClass} w-24 text-right font-mono`}
      />
      <button
        type="submit"
        aria-label="Save"
        className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <X size={16} />
      </button>
    </form>
  )
}
