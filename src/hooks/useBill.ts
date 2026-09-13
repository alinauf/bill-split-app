'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SplitHistoryEntry } from '@/components/HistoryPanel'
import type { ToastState } from '@/components/Toast'
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

export const EMPTY_DRAFT: BillDraft = {
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

export interface NewItem {
  name: string
  price: number
  quantity: number
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

/**
 * All bill state and actions, independent of layout. Used by the web app and
 * the Telegram mini app so both share persistence, maths and behaviour.
 */
export function useBill() {
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
  const addPerson = useCallback((name: string) => {
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
  }, [])

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
  const addItem = useCallback((item: NewItem) => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), ...item, shares: [] }],
    }))
    setTypeMode(false)
  }, [])

  const addItemsFromScan = useCallback(
    (scanned: NewItem[]) => {
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
    },
    [showToast]
  )

  const updateItem = (itemId: number, changes: NewItem) => {
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

  const toggleAll = useCallback((itemId: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item
        const everyone = prev.people.every((p) => item.shares.some((s) => s.personId === p.id))
        return { ...item, shares: everyone ? [] : prev.people.map((p) => ({ personId: p.id, share: 1 })) }
      }),
    }))
  }, [])

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

  const startTyping = () => {
    setTypeMode(true)
    setFocusToken((t) => t + 1)
  }

  // ---- Derived ----
  const totals = useMemo(() => calculateTotals(items, extras), [items, extras])
  const shares = useMemo(
    () => computeShares(items, people, totals, paidBy, defaultCurrency),
    [items, people, totals, paidBy, defaultCurrency]
  )
  const canShare = items.length > 0 && people.length > 0
  const splitItem = items.find((i) => i.id === splitItemId) || null
  const hasContent = people.length > 0 || items.length > 0
  const showAddForm = items.length > 0 || typeMode
  const showEmpty = items.length === 0 && !typeMode && !showScanner

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

  const jumpToSplit = () =>
    document.getElementById('each-pays')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return {
    // state
    draft,
    loaded,
    people,
    items,
    extras,
    defaultCurrency,
    convertToCurrency,
    customRate,
    paidBy,
    savedNames,
    splitHistory,
    toast,
    splitItem,
    showScanner,
    focusToken,
    // derived
    totals,
    shares,
    canShare,
    hasContent,
    showAddForm,
    showEmpty,
    // actions
    patch,
    addPerson,
    removePerson,
    renamePerson,
    addItem,
    addItemsFromScan,
    updateItem,
    removeItem,
    toggleAssignment,
    toggleAll,
    updateShare,
    resetEqual,
    openSplit: setSplitItemId,
    closeSplit: () => setSplitItemId(null),
    setShowScanner,
    startTyping,
    newBill,
    breakdownText,
    saveToHistory,
    copyBreakdown,
    shareBreakdown,
    exportBreakdown,
    copyText,
    clearHistory,
    jumpToSplit,
    showToast,
  }
}

export type Bill = ReturnType<typeof useBill>
