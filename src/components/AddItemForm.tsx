'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/bill'

interface AddItemFormProps {
  currency: string
  onAdd: (item: { name: string; price: number; quantity: number }) => void
  /** Bump this number to move focus into the name field. */
  focusToken?: number
}

const inputClass =
  'px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AddItemForm({ currency, onAdd, focusToken = 0 }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusToken > 0) nameRef.current?.focus()
  }, [focusToken])

  const parsedPrice = parseFloat(price)
  const parsedQty = parseInt(quantity, 10) || 1
  const valid = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice >= 0

  const submit = () => {
    if (!valid) return
    onAdd({ name: name.trim(), price: parsedPrice, quantity: parsedQty })
    setName('')
    setPrice('')
    setQuantity('1')
    nameRef.current?.focus()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-2"
    >
      <div className="flex gap-2">
        <input
          ref={nameRef}
          id="new-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          aria-label="Item name"
          autoComplete="off"
          className={`${inputClass} flex-1 min-w-0`}
        />
      </div>
      <div className="flex gap-2 items-center">
        <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          Qty
          <input
            id="new-item-qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="numeric"
            aria-label="Quantity"
            className={`${inputClass} w-14 text-center`}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
          Price
          <input
            id="new-item-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Unit price"
            className={`${inputClass} w-full min-w-0 text-right font-mono`}
          />
        </label>
        <button
          type="submit"
          disabled={!valid}
          aria-label="Add item"
          className="flex-shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </div>
      {valid && parsedQty > 1 && (
        <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
          = {formatCurrency(parsedPrice * parsedQty, currency)}
        </p>
      )}
    </form>
  )
}
