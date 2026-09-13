'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Lock, Receipt, RotateCcw, Send } from 'lucide-react'
import AccessCodeModal from './AccessCodeModal'
import PeopleBar from './PeopleBar'
import SplitSheet from './SplitSheet'
import StickyBar from './StickyBar'
import ScannerBlock from './ScannerBlock'
import Toast from './Toast'
import { ReceiptView } from './BillViews'
import { useBill } from '@/hooks/useBill'

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

// Extend Window interface for the Telegram WebApp SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: {
            first_name?: string
          }
        }
        colorScheme?: 'light' | 'dark'
        ready: () => void
        expand: () => void
        onEvent?: (event: string, handler: () => void) => void
        offEvent?: (event: string, handler: () => void) => void
        openTelegramLink?: (url: string) => void
        HapticFeedback?: {
          impactOccurred: (style: HapticStyle) => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        }
      }
    }
  }
}

function webApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
}

function haptic(style: HapticStyle) {
  try {
    webApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // Older clients without haptics
  }
}

const TelegramBillSplitter = () => {
  const bill = useBill()
  const [userName, setUserName] = useState('there')
  const [insideTelegram, setInsideTelegram] = useState(false)
  const [scanAccessGranted, setScanAccessGranted] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)

  // Initialise the WebApp, greet the user and follow Telegram's colour scheme.
  useEffect(() => {
    const app = webApp()
    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', app?.colorScheme === 'dark')
    }
    if (app) {
      setInsideTelegram(true)
      setUserName(app.initDataUnsafe?.user?.first_name || 'there')
      app.ready()
      app.expand()
      applyTheme()
      app.onEvent?.('themeChanged', applyTheme)
    }
    setScanAccessGranted(sessionStorage.getItem('scanAccessGranted') === 'true')
    return () => app?.offEvent?.('themeChanged', applyTheme)
  }, [])

  // Light tap feedback when assigning items.
  const toggleAssignment = useCallback(
    (itemId: number, personId: number) => {
      haptic('light')
      bill.toggleAssignment(itemId, personId)
    },
    [bill.toggleAssignment]
  )
  const billWithHaptics = { ...bill, toggleAssignment }

  // Share straight into a Telegram chat when possible, otherwise copy.
  const sendToChat = async () => {
    const app = webApp()
    const text = bill.breakdownText()
    if (app?.openTelegramLink) {
      const url = `${window.location.origin}/telegram-bot`
      app.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
      bill.saveToHistory(text)
      app.HapticFeedback?.notificationOccurred('success')
      return
    }
    await bill.shareBreakdown()
  }

  const scanner = (
    <ScannerBlock
      hasItems={bill.items.length > 0}
      open={bill.showScanner}
      onOpen={() => bill.setShowScanner(true)}
      onClose={() => bill.setShowScanner(false)}
      onItemsConfirmed={bill.addItemsFromScan}
      locked={
        scanAccessGranted ? undefined : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Receipt scanning needs an access code.</p>
            <button
              type="button"
              onClick={() => setShowAccessModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              <Lock size={16} /> Unlock scanning
            </button>
            <button
              type="button"
              onClick={() => {
                bill.setShowScanner(false)
                bill.startTyping()
              }}
              className="block mx-auto mt-2 text-xs text-gray-500 dark:text-gray-400 hover:underline"
            >
              Type items instead
            </button>
          </div>
        )
      }
    />
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-blue-600 dark:bg-blue-800 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt size={22} className="flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight">Bill Splitter</h1>
              <p className="text-xs text-blue-100 truncate">Hi {userName}, tap who had what.</p>
            </div>
          </div>
          {bill.hasContent && (
            <button
              type="button"
              onClick={bill.newBill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/15 hover:bg-white/25 transition-colors"
            >
              <RotateCcw size={13} /> New bill
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pt-4 pb-28">
        {!bill.loaded ? (
          <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
        ) : (
          <>
            <section className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 mb-4">
              <PeopleBar
                people={bill.people}
                savedNames={bill.savedNames}
                onAdd={bill.addPerson}
                onRemove={bill.removePerson}
                onRename={bill.renamePerson}
              />
            </section>
            <ReceiptView bill={billWithHaptics} scanner={scanner} />
            {insideTelegram && bill.canShare && (
              <button
                type="button"
                onClick={sendToChat}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 font-medium"
              >
                <Send size={16} /> Send breakdown to a chat
              </button>
            )}
          </>
        )}
      </main>

      {bill.loaded && bill.items.length > 0 && (
        <StickyBar
          total={bill.totals.total}
          unassignedAmount={bill.shares.unassignedAmount}
          currency={bill.defaultCurrency}
          canShare={bill.canShare}
          onShare={insideTelegram ? sendToChat : bill.shareBreakdown}
          onJump={bill.jumpToSplit}
        />
      )}

      <SplitSheet
        item={bill.splitItem}
        people={bill.people}
        currency={bill.defaultCurrency}
        onToggle={toggleAssignment}
        onUpdateShare={bill.updateShare}
        onResetEqual={bill.resetEqual}
        onClose={bill.closeSplit}
      />

      <Toast toast={bill.toast} />

      <AccessCodeModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={() => {
          setScanAccessGranted(true)
          setShowAccessModal(false)
        }}
      />
    </div>
  )
}

export default TelegramBillSplitter
