'use client'

import React, { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import {
  CURRENCIES,
  convertCurrency,
  currencySymbol,
  defaultRate,
  formatCurrency,
  type BillExtras,
  type DiscountType,
  type Shares,
  type Totals,
} from '@/lib/bill'

interface SummaryCardProps {
  totals: Totals
  shares: Shares
  extras: BillExtras
  onChangeExtras: (changes: Partial<BillExtras>) => void
  defaultCurrency: string
  onChangeDefaultCurrency: (code: string) => void
  convertToCurrency: string
  onChangeConvertToCurrency: (code: string) => void
  customRate: string
  onChangeCustomRate: (rate: string) => void
  receipt?: boolean
}

type Editing = 'service' | 'gst' | 'discount' | 'rate' | null

const inputClass =
  'px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Chip({
  on,
  label,
  onOpen,
  onRemove,
}: {
  on: boolean
  label: string
  onOpen: () => void
  onRemove?: () => void
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium ${
        on
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}
    >
      <button type="button" onClick={onOpen} className="pl-2.5 pr-1.5 py-1 hover:underline">
        {label}
      </button>
      {on && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="w-6 h-6 -ml-1 mr-0.5 inline-flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/40"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}

export default function SummaryCard({
  totals,
  shares,
  extras,
  onChangeExtras,
  defaultCurrency,
  onChangeDefaultCurrency,
  convertToCurrency,
  onChangeConvertToCurrency,
  customRate,
  onChangeCustomRate,
  receipt = false,
}: SummaryCardProps) {
  const [editing, setEditing] = useState<Editing>(null)
  const fmt = (n: number) => formatCurrency(n, defaultCurrency)
  const converting = !!convertToCurrency && convertToCurrency !== defaultCurrency
  const discountOn = !!extras.discountValue && totals.discountAmount > 0
  const symbol = currencySymbol(defaultCurrency)
  const toggle = (which: Editing) => setEditing((cur) => (cur === which ? null : which))

  const line = 'flex justify-between items-baseline gap-3 text-sm'
  const amount = 'font-mono tabular-nums'

  return (
    <div className={receipt ? '' : 'rounded-xl bg-blue-50/60 dark:bg-blue-900/15 p-4'}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className={`font-semibold ${receipt ? 'text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400' : 'text-base text-gray-900 dark:text-gray-100'}`}>
          Summary
        </h2>
        <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span className="sr-only">Currency</span>
          <select
            id="default-currency"
            value={defaultCurrency}
            onChange={(e) => {
              onChangeDefaultCurrency(e.target.value)
              onChangeCustomRate('')
            }}
            className="text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1.5">
        <div className={line}>
          <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
          <span className={`${amount} text-gray-900 dark:text-gray-100`}>{fmt(totals.subtotal)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 py-1">
          <Chip
            on={extras.serviceChargeEnabled}
            label={extras.serviceChargeEnabled ? `Service ${extras.serviceChargeRate || 0}%` : '+ Service charge'}
            onOpen={() => {
              if (!extras.serviceChargeEnabled) onChangeExtras({ serviceChargeEnabled: true })
              toggle('service')
            }}
            onRemove={() => {
              onChangeExtras({ serviceChargeEnabled: false })
              setEditing(null)
            }}
          />
          <Chip
            on={extras.gstEnabled}
            label={extras.gstEnabled ? `GST ${extras.gstRate || 0}%` : '+ GST'}
            onOpen={() => {
              if (!extras.gstEnabled) onChangeExtras({ gstEnabled: true })
              toggle('gst')
            }}
            onRemove={() => {
              onChangeExtras({ gstEnabled: false })
              setEditing(null)
            }}
          />
          <Chip
            on={discountOn}
            label={
              discountOn
                ? extras.discountType === 'percentage'
                  ? `Discount ${extras.discountValue}%`
                  : `Discount ${fmt(totals.discountAmount)}`
                : '+ Discount'
            }
            onOpen={() => toggle('discount')}
            onRemove={() => {
              onChangeExtras({ discountValue: '' })
              setEditing(null)
            }}
          />
        </div>

        {editing === 'service' && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="service-rate" className="text-gray-600 dark:text-gray-400">Service charge</label>
            <input
              id="service-rate"
              autoFocus
              inputMode="decimal"
              value={extras.serviceChargeRate}
              onChange={(e) => onChangeExtras({ serviceChargeRate: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              className={`${inputClass} w-20 text-right`}
            />
            <span className="text-gray-500">%</span>
          </div>
        )}
        {editing === 'gst' && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="gst-rate" className="text-gray-600 dark:text-gray-400">GST</label>
            <input
              id="gst-rate"
              autoFocus
              inputMode="decimal"
              value={extras.gstRate}
              onChange={(e) => onChangeExtras({ gstRate: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              className={`${inputClass} w-20 text-right`}
            />
            <span className="text-gray-500">%</span>
          </div>
        )}
        {editing === 'discount' && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="discount-value" className="text-gray-600 dark:text-gray-400">Discount</label>
            <select
              aria-label="Discount type"
              value={extras.discountType}
              onChange={(e) => onChangeExtras({ discountType: e.target.value as DiscountType })}
              className={inputClass}
            >
              <option value="percentage">%</option>
              <option value="fixed">{symbol}</option>
            </select>
            <input
              id="discount-value"
              autoFocus
              inputMode="decimal"
              value={extras.discountValue}
              onChange={(e) => onChangeExtras({ discountValue: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              placeholder="0"
              className={`${inputClass} w-24 text-right`}
            />
          </div>
        )}

        {totals.discountAmount > 0 && (
          <div className={`${line} text-red-600 dark:text-red-400`}>
            <span>Discount</span>
            <span className={amount}>-{fmt(totals.discountAmount)}</span>
          </div>
        )}
        {extras.serviceChargeEnabled && (
          <div className={line}>
            <span className="text-gray-700 dark:text-gray-300">Service charge ({extras.serviceChargeRate || 0}%)</span>
            <span className={`${amount} text-gray-900 dark:text-gray-100`}>{fmt(totals.serviceChargeAmount)}</span>
          </div>
        )}
        {extras.gstEnabled && (
          <div className={line}>
            <span className="text-gray-700 dark:text-gray-300">GST ({extras.gstRate || 0}%)</span>
            <span className={`${amount} text-gray-900 dark:text-gray-100`}>{fmt(totals.gstAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline gap-3 border-t border-gray-300/70 dark:border-gray-600 pt-2 mt-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
          <span className={`${amount} font-semibold text-xl text-gray-900 dark:text-gray-100`}>{fmt(totals.total)}</span>
        </div>

        <div className="flex justify-between items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <label className="flex items-center gap-1">
            <span>Also show in</span>
            <select
              id="convert-currency"
              value={convertToCurrency}
              onChange={(e) => {
                onChangeConvertToCurrency(e.target.value)
                onChangeCustomRate('')
                setEditing(null)
              }}
              className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">none</option>
              {CURRENCIES.filter((c) => c.code !== defaultCurrency).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
          {converting && (
            <span className={`${amount} flex items-center gap-1`}>
              ≈ {formatCurrency(convertCurrency(totals.total, defaultCurrency, convertToCurrency, customRate), convertToCurrency)}
              <button
                type="button"
                onClick={() => toggle('rate')}
                aria-label="Edit exchange rate"
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Pencil size={11} />
              </button>
            </span>
          )}
        </div>
        {converting && editing === 'rate' && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <label htmlFor="custom-rate">1 {defaultCurrency} =</label>
            <input
              id="custom-rate"
              autoFocus
              inputMode="decimal"
              value={customRate}
              onChange={(e) => onChangeCustomRate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              placeholder={defaultRate(defaultCurrency, convertToCurrency).toFixed(4)}
              className={`${inputClass} w-28 text-right font-mono`}
            />
            <span>{convertToCurrency}</span>
          </div>
        )}

        {shares.unassignedAmount > 0.005 && (
          <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm">
            <div className="flex justify-between gap-3 text-amber-800 dark:text-amber-200 font-medium">
              <span>Unassigned</span>
              <span className={amount}>{fmt(shares.unassignedAmount)}</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {shares.unassignedItems.map((i) => i.name).join(', ')} — nobody is paying for {shares.unassignedItems.length === 1 ? 'this' : 'these'} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
