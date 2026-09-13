'use client'

import React, { type ReactNode } from 'react'
import type { Bill } from '@/hooks/useBill'
import ItemRow from './ItemRow'
import AddItemForm from './AddItemForm'
import SplitGrid from './SplitGrid'
import SummaryCard from './SummaryCard'
import SettleUp from './SettleUp'
import EmptyState from './EmptyState'
import HistoryPanel from './HistoryPanel'

interface ViewProps {
  bill: Bill
  /** Scanner UI (a link that expands into the scanner, or an unlock button). */
  scanner: ReactNode
}

export function BillSummary({ bill, receipt }: { bill: Bill; receipt: boolean }) {
  return (
    <SummaryCard
      receipt={receipt}
      totals={bill.totals}
      shares={bill.shares}
      extras={bill.extras}
      onChangeExtras={bill.patch}
      defaultCurrency={bill.defaultCurrency}
      onChangeDefaultCurrency={(code) => bill.patch({ defaultCurrency: code })}
      convertToCurrency={bill.convertToCurrency}
      onChangeConvertToCurrency={(code) => bill.patch({ convertToCurrency: code })}
      customRate={bill.customRate}
      onChangeCustomRate={(rate) => bill.patch({ customRate: rate })}
    />
  )
}

export function BillSettleUp({ bill, receipt }: { bill: Bill; receipt: boolean }) {
  return (
    <div id="each-pays" className="scroll-mt-4">
      <SettleUp
        receipt={receipt}
        people={bill.people}
        items={bill.items}
        shares={bill.shares}
        paidBy={bill.paidBy}
        onChangePaidBy={(id) => bill.patch({ paidBy: id })}
        currency={bill.defaultCurrency}
        convertToCurrency={bill.convertToCurrency}
        customRate={bill.customRate}
        canShare={bill.canShare}
        onCopy={bill.copyBreakdown}
        onExport={bill.exportBreakdown}
        onCopyLine={bill.copyText}
      />
    </div>
  )
}

/** Phone layout: one receipt-style card with items, totals and "each pays". */
export function ReceiptView({ bill, scanner }: ViewProps) {
  return (
    <div className="space-y-4">
      {bill.showEmpty && <EmptyState onScan={() => bill.setShowScanner(true)} onType={bill.startTyping} />}
      {scanner}
      {(bill.items.length > 0 || bill.showAddForm) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-4 py-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-1">Items</h2>
          <div>
            {bill.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                people={bill.people}
                currency={bill.defaultCurrency}
                onToggle={bill.toggleAssignment}
                onToggleAll={bill.toggleAll}
                onOpenSplit={bill.openSplit}
                onUpdate={bill.updateItem}
                onRemove={bill.removeItem}
              />
            ))}
          </div>
          {bill.showAddForm && (
            <div className="pt-3">
              <AddItemForm currency={bill.defaultCurrency} onAdd={bill.addItem} focusToken={bill.focusToken} />
            </div>
          )}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-4 pt-3">
            <BillSummary bill={bill} receipt />
          </div>
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-4 pt-3">
            <BillSettleUp bill={bill} receipt />
          </div>
        </section>
      )}
      <HistoryPanel history={bill.splitHistory} onCopy={bill.copyText} onClear={bill.clearHistory} />
    </div>
  )
}

/** Wide layout: items x people grid with a pinned summary column. */
export function GridView({ bill, scanner }: ViewProps) {
  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
      <div className="space-y-4">
        {bill.showEmpty ? (
          <EmptyState onScan={() => bill.setShowScanner(true)} onType={bill.startTyping} />
        ) : (
          <SplitGrid
            items={bill.items}
            people={bill.people}
            shares={bill.shares}
            total={bill.totals.total}
            currency={bill.defaultCurrency}
            onToggle={bill.toggleAssignment}
            onToggleAll={bill.toggleAll}
            onOpenSplit={bill.openSplit}
            onUpdate={bill.updateItem}
            onRemove={bill.removeItem}
          />
        )}
        {bill.showAddForm && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Add an item</h2>
            <AddItemForm currency={bill.defaultCurrency} onAdd={bill.addItem} focusToken={bill.focusToken} />
          </div>
        )}
        {scanner}
        <HistoryPanel history={bill.splitHistory} onCopy={bill.copyText} onClear={bill.clearHistory} />
      </div>
      <aside className="space-y-4 md:sticky md:top-4">
        <BillSummary bill={bill} receipt={false} />
        <BillSettleUp bill={bill} receipt={false} />
      </aside>
    </div>
  )
}
