'use client'

import React, { type ReactNode } from 'react'
import { Camera, X } from 'lucide-react'
import BillScanner from './BillScanner'
import type { NewItem } from '@/hooks/useBill'

interface ScannerBlockProps {
  hasItems: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  onItemsConfirmed: (items: NewItem[]) => void
  /** Rendered instead of the scanner when scanning is locked. */
  locked?: ReactNode
}

export default function ScannerBlock({ hasItems, open, onOpen, onClose, onItemsConfirmed, locked }: ScannerBlockProps) {
  if (locked && open) return <>{locked}</>
  return (
    <div className="space-y-2">
      {hasItems && !open && (
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Camera size={16} /> Scan a receipt
        </button>
      )}
      {open && (
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide scanner"
            className="absolute right-2 top-2 z-10 p-1 rounded-full text-gray-500 hover:bg-white/70 dark:hover:bg-gray-700"
          >
            <X size={16} />
          </button>
          <BillScanner onItemsConfirmed={onItemsConfirmed} />
        </div>
      )}
    </div>
  )
}
