'use client'

import React from 'react'
import { Receipt, RotateCcw } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import PeopleBar from './PeopleBar'
import SplitSheet from './SplitSheet'
import StickyBar from './StickyBar'
import ScannerBlock from './ScannerBlock'
import Toast from './Toast'
import { GridView, ReceiptView } from './BillViews'
import { useBill } from '@/hooks/useBill'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const BillSplitter = () => {
  const bill = useBill()
  const isWide = useMediaQuery('(min-width: 768px)')

  const scanner = (
    <ScannerBlock
      hasItems={bill.items.length > 0}
      open={bill.showScanner}
      onOpen={() => bill.setShowScanner(true)}
      onClose={() => bill.setShowScanner(false)}
      onItemsConfirmed={bill.addItemsFromScan}
    />
  )

  return (
    <>
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 min-h-screen ${isWide === false ? 'pb-28' : 'pb-10'}`}>
        <header className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Receipt className="text-blue-600 dark:text-blue-400" />
              Bill Splitter
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tap who had what. Extras and totals update as you go.</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {bill.hasContent && (
              <button
                type="button"
                onClick={bill.newBill}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw size={13} /> New bill
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {!bill.loaded || isWide === undefined ? (
          <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
        ) : (
          <>
            <section className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 mb-4">
              <PeopleBar
                people={bill.people}
                savedNames={bill.savedNames}
                onAdd={bill.addPerson}
                onRemove={bill.removePerson}
                onRename={bill.renamePerson}
              />
            </section>
            {isWide ? <GridView bill={bill} scanner={scanner} /> : <ReceiptView bill={bill} scanner={scanner} />}
          </>
        )}
      </div>

      {isWide === false && bill.loaded && bill.items.length > 0 && (
        <StickyBar
          total={bill.totals.total}
          unassignedAmount={bill.shares.unassignedAmount}
          currency={bill.defaultCurrency}
          canShare={bill.canShare}
          onShare={bill.shareBreakdown}
          onJump={bill.jumpToSplit}
        />
      )}

      <SplitSheet
        item={bill.splitItem}
        people={bill.people}
        currency={bill.defaultCurrency}
        onToggle={bill.toggleAssignment}
        onUpdateShare={bill.updateShare}
        onResetEqual={bill.resetEqual}
        onClose={bill.closeSplit}
      />

      <Toast toast={bill.toast} />
    </>
  )
}

export default BillSplitter
