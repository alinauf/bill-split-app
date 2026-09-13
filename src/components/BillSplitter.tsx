'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Receipt, RotateCcw, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import BillScanner from './BillScanner'
import PeopleBar from './PeopleBar'
import ItemRow from './ItemRow'
import AddItemForm from './AddItemForm'
import SplitGrid from './SplitGrid'
import SplitSheet from './SplitSheet'
import SummaryCard from './SummaryCard'
import SettleUp from './SettleUp'
import StickyBar from './StickyBar'
import EmptyState from './EmptyState'
import HistoryPanel, { type SplitHistoryEntry } from './HistoryPanel'
import Toast, { type ToastState } from './Toast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { loadFromStorage, saveToStorage } from '@/lib/storage'
import {
  calculateTotals,
  computeShares,
  generateBreakdownText,
  nextColor,
  type BillDraft,
  type BillExtras,
  type Item,
  type Person,
} from '@/lib/bill'

const DRAFT_KEY = 'billsplit-draft'
const NAMES_KEY = 'billsplit-saved-names'
const HISTORY_KEY = 'billsplit-history'

const EMPTY_DRAFT: BillDraft = {
  people: [],
  items: [],
  gstEnabled: false,
  gstRate: '8',
  serviceChargeEnabled: false,
  serviceChargeRate: '10',
  discountType: 'percentage',
  discountValue: '',
  defaultCurrency: 'MVR',
  convertToCurrency: '',
  customRate: '',
  paidBy: null,
}

interface Snapshot {
  people: Person[]
  items: Item[]
  paidBy: number | null
}

/** Older drafts may lack colours; assign them deterministically. */
function normaliseDraft(raw: Partial<BillDraft> | null): BillDraft {
  const draft = { ...EMPTY_DRAFT, ...(raw || {}) }
  const people: Person[] = []
  ;(draft.people || []).forEach((p) => {
    if (!p || typeof p.name !== 'string') return
    const color = typeof p.color === 'number' ? p.color : nextColor(people)
    people.push({ id: p.id, name: p.name, color })
  })
  const items = (draft.items || []).filter((i) => i && typeof i.name === 'string')
  return { ...draft, people, items }
}

const BillSplitter = () => {
  const [draft, setDraft] = useState<BillDraft>(EMPTY_DRAFT)
  const [loaded, setLoaded] = useState(false)
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [splitHistory, setSplitHistory] = useState<SplitHistoryEntry[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [splitItemId, setSplitItemId] = useState<number | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [typeMode, setTypeMode] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWide = useMediaQuery('(min-width: 768px)')

  const { people, items, defaultCurrency, convertToCurrency, customRate, paidBy } = draft
  const extras = useMemo<BillExtras>(
    () => ({
      gstEnabled: draft.gstEnabled,
      gstRate: draft.gstRate,
      serviceChargeEnabled: draft.serviceChargeEnabled,
      serviceChargeRate: draft.serviceChargeRate,
      discountType: draft.discountType,
      discountValue: draft.discountValue,
    }),
    [draft.gstEnabled, draft.gstRate, draft.serviceChargeEnabled, draft.serviceChargeRate, draft.discountType, draft.discountValue]
  )

  // Load persisted state once on the client.
  useEffect(() => {
    setDraft(normaliseDraft(loadFromStorage<Partial<BillDraft> | null>(DRAFT_KEY, null)))
    setSavedNames(loadFromStorage<string[]>(NAMES_KEY, []))
    setSplitHistory(loadFromStorage<SplitHistoryEntry[]>(HISTORY_KEY, []))
    setLoaded(true)
  }, [])

  // Autosave the draft so a reload never loses the bill.
  useEffect(() => {
    if (loaded) saveToStorage(DRAFT_KEY, draft)
  }, [draft, loaded])

  const patch = useCallback((changes: Partial<BillDraft>) => {
    setDraft((prev) => ({ ...prev, ...changes }))
  }, [])

  const showToast = useCallback((next: ToastState, ms = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(next)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  const undoable = useCallback(
    (message: string, snapshot: Snapshot) => {
      showToast(
        {
          message,
          actionLabel: 'Undo',
          onAction: () => {
            patch(snapshot)
            dismissToast()
          },
        },
        5000
      )
    },
    [showToast, patch, dismissToast]
  )

  // ---- People ----
  const addPerson = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setDraft((prev) => ({
      ...prev,
      people: [...prev.people, { id: Date.now(), name: trimmed, color: nextColor(prev.people) }],
    }))
    setSavedNames((prev) => {
      const updated = [trimmed, ...prev.filter((n) => n !== trimmed)].slice(0, 8)
      saveToStorage(NAMES_KEY, updated)
      return updated
    })
  }

  const removePerson = (personId: number) => {
    const person = people.find((p) => p.id === personId)
    if (!person) return
    const snapshot: Snapshot = { people, items, paidBy }
    patch({
      people: people.filter((p) => p.id !== personId),
      items: items.map((item) => ({ ...item, shares: item.shares.filter((s) => s.personId !== personId) })),
      paidBy: paidBy === personId ? null : paidBy,
    })
    undoable(`Removed ${person.name}`, snapshot)
  }

  const renamePerson = (personId: number, name: string) => {
    patch({ people: people.map((p) => (p.id === personId ? { ...p, name } : p)) })
  }

  // ---- Items ----
  const addItem = (item: { name: string; price: number; quantity: number }) => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), ...item, shares: [] }],
    }))
    setTypeMode(false)
  }

  const addItemsFromScan = (scanned: Array<{ name: string; price: number; quantity: number }>) => {
    const newItems: Item[] = scanned.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      price: item.quantity > 1 ? item.price / item.quantity : item.price,
      quantity: item.quantity || 1,
      shares: [],
    }))
    setDraft((prev) => ({ ...prev, items: [...prev.items, ...newItems] }))
    setShowScanner(false)
    showToast({ message: `Added ${newItems.length} item${newItems.length === 1 ? '' : 's'} from the receipt`, kind: 'success' })
  }

  const updateItem = (itemId: number, changes: { name: string; price: number; quantity: number }) => {
    patch({ items: items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)) })
  }

  const removeItem = (itemId: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const snapshot: Snapshot = { people, items, paidBy }
    patch({ items: items.filter((i) => i.id !== itemId) })
    if (splitItemId === itemId) setSplitItemId(null)
    undoable(`Removed ${item.name}`, snapshot)
  }

  const toggleAssignment = useCallback((itemId: number, personId: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item
        const has = item.shares.some((s) => s.personId === personId)
        return {
          ...item,
          shares: has ? item.shares.filter((s) => s.personId !== personId) : [...item.shares, { personId, share: 1 }],
        }
      }),
    }))
  }, [])

  const toggleAll = (itemId: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item
        const everyone = prev.people.every((p) => item.shares.some((s) => s.personId === p.id))
        return { ...item, shares: everyone ? [] : prev.people.map((p) => ({ personId: p.id, share: 1 })) }
      }),
    }))
  }

  const updateShare = useCallback((itemId: number, personId: number, share: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, shares: item.shares.map((s) => (s.personId === personId ? { ...s, share } : s)) }
          : item
      ),
    }))
  }, [])

  const resetEqual = useCallback((itemId: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, shares: item.shares.map((s) => ({ ...s, share: 1 })) } : item
      ),
    }))
  }, [])

  const newBill = () => {
    if (people.length === 0 && items.length === 0) return
    const snapshot: Snapshot = { people, items, paidBy }
    patch({ people: [], items: [], paidBy: null, discountValue: '' })
    setShowScanner(false)
    setTypeMode(false)
    undoable('Started a new bill', snapshot)
  }

  // ---- Derived ----
  const totals = useMemo(() => calculateTotals(items, extras), [items, extras])
  const shares = useMemo(
    () => computeShares(items, people, totals, paidBy, defaultCurrency),
    [items, people, totals, paidBy, defaultCurrency]
  )
  const canShare = items.length > 0 && people.length > 0
  const splitItem = items.find((i) => i.id === splitItemId) || null

  const breakdownText = () =>
    generateBreakdownText({
      items,
      people,
      extras,
      totals,
      shares,
      paidBy,
      defaultCurrency,
      convertToCurrency,
      customRate,
    })

  // ---- Share / export / history ----
  const saveToHistory = (text: string) => {
    const entry: SplitHistoryEntry = {
      id: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      currency: defaultCurrency,
      people: people.map((p) => ({ name: p.name, total: shares.byPerson.get(p.id) || 0 })),
      total: totals.total,
      breakdownText: text,
    }
    setSplitHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 3)
      saveToStorage(HISTORY_KEY, updated)
      return updated
    })
  }

  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textArea)
      return ok
    } catch {
      return false
    }
  }

  const copyBreakdown = async () => {
    const text = breakdownText()
    const copied = await writeClipboard(text)
    if (copied) {
      saveToHistory(text)
      showToast({ message: 'Breakdown copied', kind: 'success' })
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bill Breakdown', text })
        saveToHistory(text)
      } catch {
        // User cancelled
      }
    }
  }

  const shareBreakdown = async () => {
    const text = breakdownText()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bill Breakdown', text })
        saveToHistory(text)
        return
      } catch {
        // Cancelled or unsupported — fall back to copying
      }
    }
    await copyBreakdown()
  }

  const exportBreakdown = () => {
    const text = breakdownText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill-breakdown-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    saveToHistory(text)
  }

  const copyText = async (text: string) => {
    if (await writeClipboard(text)) showToast({ message: 'Copied', kind: 'success' })
  }

  const clearHistory = () => {
    setSplitHistory([])
    setSavedNames([])
    saveToStorage(HISTORY_KEY, [])
    saveToStorage(NAMES_KEY, [])
  }

  const jumpToSplit = () => document.getElementById('each-pays')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // ---- Render ----
  const hasContent = people.length > 0 || items.length > 0
  const showAddForm = items.length > 0 || typeMode
  const showEmpty = items.length === 0 && !typeMode && !showScanner

  const summaryCard = (receipt: boolean) => (
    <SummaryCard
      receipt={receipt}
      totals={totals}
      shares={shares}
      extras={extras}
      onChangeExtras={patch}
      defaultCurrency={defaultCurrency}
      onChangeDefaultCurrency={(code) => patch({ defaultCurrency: code })}
      convertToCurrency={convertToCurrency}
      onChangeConvertToCurrency={(code) => patch({ convertToCurrency: code })}
      customRate={customRate}
      onChangeCustomRate={(rate) => patch({ customRate: rate })}
    />
  )

  const settleUp = (receipt: boolean) => (
    <div id="each-pays" className="scroll-mt-4">
      <SettleUp
        receipt={receipt}
        people={people}
        items={items}
        shares={shares}
        paidBy={paidBy}
        onChangePaidBy={(id) => patch({ paidBy: id })}
        currency={defaultCurrency}
        convertToCurrency={convertToCurrency}
        customRate={customRate}
        canShare={canShare}
        onCopy={copyBreakdown}
        onExport={exportBreakdown}
        onCopyLine={copyText}
      />
    </div>
  )

  const scannerBlock = (
    <div className="space-y-2">
      {items.length > 0 && !showScanner && (
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Camera size={16} /> Scan a receipt
        </button>
      )}
      {showScanner && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowScanner(false)}
            aria-label="Hide scanner"
            className="absolute right-2 top-2 z-10 p-1 rounded-full text-gray-500 hover:bg-white/70 dark:hover:bg-gray-700"
          >
            <X size={16} />
          </button>
          <BillScanner onItemsConfirmed={addItemsFromScan} />
        </div>
      )}
    </div>
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
            {hasContent && (
              <button
                type="button"
                onClick={newBill}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw size={13} /> New bill
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {!loaded || isWide === undefined ? (
          <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
        ) : (
          <>
            <section className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 mb-4">
              <PeopleBar people={people} savedNames={savedNames} onAdd={addPerson} onRemove={removePerson} onRename={renamePerson} />
            </section>

            {isWide ? (
              <div className="grid md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                <div className="space-y-4">
                  {showEmpty ? (
                    <EmptyState
                      onScan={() => setShowScanner(true)}
                      onType={() => {
                        setTypeMode(true)
                        setFocusToken((t) => t + 1)
                      }}
                    />
                  ) : (
                    <SplitGrid
                      items={items}
                      people={people}
                      shares={shares}
                      total={totals.total}
                      currency={defaultCurrency}
                      onToggle={toggleAssignment}
                      onToggleAll={toggleAll}
                      onOpenSplit={setSplitItemId}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                    />
                  )}
                  {showAddForm && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Add an item</h2>
                      <AddItemForm currency={defaultCurrency} onAdd={addItem} focusToken={focusToken} />
                    </div>
                  )}
                  {scannerBlock}
                  <HistoryPanel history={splitHistory} onCopy={copyText} onClear={clearHistory} />
                </div>
                <aside className="space-y-4 md:sticky md:top-4">
                  {summaryCard(false)}
                  {settleUp(false)}
                </aside>
              </div>
            ) : (
              <div className="space-y-4">
                {showEmpty ? (
                  <EmptyState
                    onScan={() => setShowScanner(true)}
                    onType={() => {
                      setTypeMode(true)
                      setFocusToken((t) => t + 1)
                    }}
                  />
                ) : null}
                {scannerBlock}
                {(items.length > 0 || showAddForm) && (
                  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-4 py-3">
                    <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-1">Items</h2>
                    <div>
                      {items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          people={people}
                          currency={defaultCurrency}
                          onToggle={toggleAssignment}
                          onToggleAll={toggleAll}
                          onOpenSplit={setSplitItemId}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                    {showAddForm && (
                      <div className="pt-3">
                        <AddItemForm currency={defaultCurrency} onAdd={addItem} focusToken={focusToken} />
                      </div>
                    )}
                    <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-4 pt-3">{summaryCard(true)}</div>
                    <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mt-4 pt-3">{settleUp(true)}</div>
                  </section>
                )}
                <HistoryPanel history={splitHistory} onCopy={copyText} onClear={clearHistory} />
              </div>
            )}
          </>
        )}
      </div>

      {isWide === false && loaded && items.length > 0 && (
        <StickyBar
          total={totals.total}
          unassignedAmount={shares.unassignedAmount}
          currency={defaultCurrency}
          canShare={canShare}
          onShare={shareBreakdown}
          onJump={jumpToSplit}
        />
      )}

      <SplitSheet
        item={splitItem}
        people={people}
        currency={defaultCurrency}
        onToggle={toggleAssignment}
        onUpdateShare={updateShare}
        onResetEqual={resetEqual}
        onClose={() => setSplitItemId(null)}
      />

      <Toast toast={toast} />
    </>
  )
}

export default BillSplitter
