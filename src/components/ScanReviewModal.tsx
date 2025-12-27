'use client'

import React, { useState, useEffect } from 'react'
import { X, Trash2, Plus, AlertCircle, Check } from 'lucide-react'

export interface ScannedItem {
  name: string
  price: number
  quantity: number
  confidence: 'high' | 'medium' | 'low'
}

interface EditableItem extends ScannedItem {
  id: number
  selected: boolean
}

interface ScanReviewModalProps {
  isOpen: boolean
  onClose: () => void
  items: ScannedItem[]
  onConfirm: (items: Array<{ name: string; price: number; quantity: number }>) => void
  warnings?: string[]
}

export default function ScanReviewModal({
  isOpen,
  onClose,
  items,
  onConfirm,
  warnings = [],
}: ScanReviewModalProps) {
  const [editableItems, setEditableItems] = useState<EditableItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEditableItems(
        items.map((item, index) => ({
          ...item,
          id: Date.now() + index,
          selected: true,
        }))
      )
    }
  }, [isOpen, items])

  if (!isOpen) return null

  const updateItem = (id: number, field: 'name' | 'price' | 'quantity', value: string) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'name') {
            return { ...item, name: value }
          } else if (field === 'price') {
            return { ...item, price: parseFloat(value) || 0 }
          } else {
            return { ...item, quantity: parseInt(value) || 1 }
          }
        }
        return item
      })
    )
  }

  const toggleSelect = (id: number) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const deleteItem = (id: number) => {
    setEditableItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addManualItem = () => {
    if (newItemName.trim() && newItemPrice) {
      setEditableItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: newItemName.trim(),
          price: parseFloat(newItemPrice),
          quantity: 1,
          confidence: 'high' as const,
          selected: true,
        },
      ])
      setNewItemName('')
      setNewItemPrice('')
    }
  }

  const selectAll = () => {
    setEditableItems((prev) => prev.map((item) => ({ ...item, selected: true })))
  }

  const deselectAll = () => {
    setEditableItems((prev) =>
      prev.map((item) => ({ ...item, selected: false }))
    )
  }

  const handleConfirm = () => {
    const selectedItems = editableItems
      .filter((item) => item.selected && item.name.trim() && item.price > 0)
      .map((item) => ({ name: item.name, price: item.price, quantity: item.quantity }))
    onConfirm(selectedItems)
  }

  const selectedCount = editableItems.filter((item) => item.selected).length

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
    }
  }

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return null
      case 'medium':
        return (
          <span className="text-xs px-1.5 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">
            Review
          </span>
        )
      case 'low':
        return (
          <span className="text-xs px-1.5 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded flex items-center gap-1">
            <AlertCircle size={10} />
            Unclear
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-gray-100">
            Review Scanned Items
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-4 pt-3">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 text-sm text-yellow-800 dark:text-yellow-200">
              {warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Select All / Deselect All */}
        <div className="px-4 pt-3 flex gap-2 text-sm">
          <button
            onClick={selectAll}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Select All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={deselectAll}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Deselect All
          </button>
          <span className="ml-auto text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </span>
        </div>

        {/* Items List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {editableItems.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No items detected. Add items manually below.
            </p>
          ) : (
            editableItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-md border ${getConfidenceColor(item.confidence)} ${
                  !item.selected ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      item.selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {item.selected && <Check size={14} />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      {getConfidenceBadge(item.confidence)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Qty</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          min="1"
                          className="w-12 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1 min-w-[100px]">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Manual Item */}
          <div className="pt-2 border-t dark:border-gray-700 mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Add missed item:
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
              <div className="flex gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={addManualItem}
                  className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
