'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Users,
  Receipt,
  Share2,
  Trash2,
  Camera,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import BillScanner from './BillScanner'
import AccessCodeModal from './AccessCodeModal'

interface Person {
  id: number
  name: string
}

interface Item {
  id: number
  name: string
  price: number
  quantity: number
  assignedTo: number[]
}

interface Currency {
  code: string
  symbol: string
  name: string
}

interface Totals {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  serviceChargeAmount: number
  afterServiceCharge: number
  gstAmount: number
  total: number
}

// Helper to safely get Telegram Web App data
function getTelegramWebAppData(): { userName: string; isDark: boolean } {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp
    return {
      userName: webApp.initDataUnsafe?.user?.first_name || 'Guest',
      isDark: webApp.colorScheme === 'dark',
    }
  }
  return { userName: 'Guest', isDark: false }
}

// Extend Window interface for Telegram WebApp
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
      }
    }
  }
}

const TelegramBillSplitter = () => {
  const [telegramData, setTelegramData] = useState({
    userName: 'Guest',
    isDark: false,
  })

  // State
  const [people, setPeople] = useState<Person[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newPersonName, setNewPersonName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstRate, setGstRate] = useState('8')
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false)
  const [serviceChargeRate, setServiceChargeRate] = useState('10')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    'percentage'
  )
  const [discountValue, setDiscountValue] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('MVR')
  const [showSettings, setShowSettings] = useState(false)
  const [scanAccessGranted, setScanAccessGranted] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Initialize Telegram WebApp and get user data
  useEffect(() => {
    // Get Telegram data
    const data = getTelegramWebAppData()
    setTelegramData(data)

    // Tell Telegram the app is ready and expand it
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }

    // Check session storage for scan access
    const granted = sessionStorage.getItem('scanAccessGranted') === 'true'
    setScanAccessGranted(granted)
  }, [])

  // Theme integration
  useEffect(() => {
    if (telegramData.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [telegramData.isDark])

  const exchangeRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    SGD: 1.34,
    INR: 83.12,
    MYR: 4.67,
    THB: 35.8,
    MVR: 15.42,
  }

  const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MVR', symbol: 'MVR', name: 'Maldivian Rufiyaa' },
  ]

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find((c) => c.code === currencyCode)
    const symbol = currency ? currency.symbol : currencyCode
    return `${symbol}${amount.toFixed(2)}`
  }

  const getDefaultCurrencySymbol = (): string => {
    const currency = currencies.find((c) => c.code === defaultCurrency)
    return currency ? currency.symbol : defaultCurrency
  }

  const addPerson = () => {
    if (newPersonName.trim()) {
      setPeople([...people, { id: Date.now(), name: newPersonName.trim() }])
      setNewPersonName('')
    }
  }

  const removePerson = (personId: number) => {
    setPeople(people.filter((p) => p.id !== personId))
    setItems(
      items.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((id) => id !== personId),
      }))
    )
  }

  const addItem = () => {
    if (newItemName.trim() && newItemPrice && people.length > 0) {
      setItems([
        ...items,
        {
          id: Date.now(),
          name: newItemName.trim(),
          price: parseFloat(newItemPrice),
          quantity: parseInt(newItemQty) || 1,
          assignedTo: [],
        },
      ])
      setNewItemName('')
      setNewItemPrice('')
      setNewItemQty('1')
    }
  }

  const removeItem = (itemId: number) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const addItemsFromScan = (
    scannedItems: Array<{ name: string; price: number; quantity: number }>
  ) => {
    const newItems = scannedItems.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      assignedTo: [],
    }))
    setItems([...items, ...newItems])
  }

  const toggleItemAssignment = (itemId: number, personId: number) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const isAssigned = item.assignedTo.includes(personId)
          return {
            ...item,
            assignedTo: isAssigned
              ? item.assignedTo.filter((id) => id !== personId)
              : [...item.assignedTo, personId],
          }
        }
        return item
      })
    )
  }

  const calculateTotals = (): Totals => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    let discountAmount = 0
    if (discountValue) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * parseFloat(discountValue)) / 100
      } else {
        discountAmount = parseFloat(discountValue)
      }
    }

    const afterDiscount = subtotal - discountAmount
    const serviceChargeAmount =
      serviceChargeEnabled && serviceChargeRate
        ? (afterDiscount * parseFloat(serviceChargeRate)) / 100
        : 0
    const afterServiceCharge = afterDiscount + serviceChargeAmount
    const gstAmount =
      gstEnabled && gstRate
        ? (afterServiceCharge * parseFloat(gstRate)) / 100
        : 0
    const total = afterServiceCharge + gstAmount

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      serviceChargeAmount,
      afterServiceCharge,
      gstAmount,
      total,
    }
  }

  const calculatePersonTotal = (personId: number): number => {
    let personTotal = 0

    items.forEach((item) => {
      if (item.assignedTo.includes(personId)) {
        const shareCount = item.assignedTo.length
        const itemTotal = item.price * item.quantity
        personTotal += itemTotal / shareCount
      }
    })

    const totals = calculateTotals()
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    if (subtotal > 0) {
      const ratio = personTotal / subtotal
      const afterDiscount = personTotal - totals.discountAmount * ratio
      const serviceChargeAmount =
        serviceChargeEnabled && serviceChargeRate
          ? (afterDiscount * parseFloat(serviceChargeRate)) / 100
          : 0
      const afterServiceCharge = afterDiscount + serviceChargeAmount
      const gstAmount =
        gstEnabled && gstRate
          ? (afterServiceCharge * parseFloat(gstRate)) / 100
          : 0
      return afterServiceCharge + gstAmount
    }

    return 0
  }

  const getPersonItems = (personId: number): Item[] => {
    return items.filter((item) => item.assignedTo.includes(personId))
  }

  const generateBreakdownText = (): string => {
    const totals = calculateTotals()
    let breakdown = '🧾 Bill Breakdown\n\n'

    breakdown += '📋 Items:\n'
    items.forEach((item) => {
      const qtyPrefix = item.quantity > 1 ? `${item.quantity}x ` : ''
      const itemTotal = item.price * item.quantity
      breakdown += `• ${qtyPrefix}${item.name} - ${formatCurrency(
        itemTotal,
        defaultCurrency
      )}\n`
    })

    breakdown += `\n💰 Total: ${formatCurrency(
      totals.total,
      defaultCurrency
    )}\n`

    breakdown += '\n👥 Per Person:\n'
    people.forEach((person) => {
      const personTotal = calculatePersonTotal(person.id)
      breakdown += `• ${person.name}: ${formatCurrency(
        personTotal,
        defaultCurrency
      )}\n`
    })

    return breakdown
  }

  const copyToClipboard = async () => {
    const text = generateBreakdownText()

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers/WebViews
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      // Show success toast
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    } catch {
      // Last resort: try Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Bill Breakdown',
            text: text,
          })
        } catch {
          // User cancelled or share failed
        }
      }
    }
  }

  const handleScanClick = () => {
    if (!scanAccessGranted) {
      setShowAccessModal(true)
    }
  }

  const handleAccessGranted = () => {
    setScanAccessGranted(true)
    setShowAccessModal(false)
  }

  const totals = calculateTotals()

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 pb-24 safe-area-inset'>
      {/* Header */}
      <div className='sticky top-0 z-40 bg-blue-600 dark:bg-blue-800 text-white p-4 shadow-lg'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Receipt size={24} />
            <div>
              <h1 className='font-bold text-lg'>Bill Splitter</h1>
              <p className='text-xs text-blue-100'>
                Hi, {telegramData.userName}!
              </p>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={items.length === 0 || people.length === 0}
            className='p-3 bg-white/20 rounded-full active:bg-white/30 disabled:opacity-50 touch-manipulation'
          >
            <Share2 size={22} />
          </button>
        </div>
      </div>

      <div className='p-4 space-y-4'>
        {/* People Section */}
        <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-xl'>
          <h2 className='font-semibold mb-3 dark:text-gray-100 flex items-center gap-2'>
            <Users className='text-blue-600 dark:text-blue-400' size={18} />
            People
          </h2>
          <div className='flex gap-2 mb-3'>
            <input
              type='text'
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Person's name"
              className='flex-1 px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              onKeyPress={(e) => e.key === 'Enter' && addPerson()}
            />
            <button
              onClick={addPerson}
              disabled={!newPersonName.trim()}
              className='px-5 py-3 bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-50 touch-manipulation'
            >
              <Plus size={22} />
            </button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {people.map((person) => (
              <div
                key={person.id}
                className='flex items-center gap-1 bg-white dark:bg-gray-700 pl-4 pr-2 py-2 rounded-full border border-gray-200 dark:border-gray-600'
              >
                <span className='dark:text-gray-100 text-sm'>
                  {person.name}
                </span>
                <button
                  onClick={() => removePerson(person.id)}
                  className='text-red-500 active:text-red-700 p-1 touch-manipulation'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Scanner Section */}
        <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-xl'>
          <h2 className='font-semibold mb-3 dark:text-gray-100 flex items-center gap-2'>
            <Camera className='text-blue-600 dark:text-blue-400' size={18} />
            Scan Bill
          </h2>
          {scanAccessGranted ? (
            <BillScanner
              onItemsConfirmed={addItemsFromScan}
              disabled={people.length === 0}
            />
          ) : (
            <button
              onClick={handleScanClick}
              disabled={people.length === 0}
              className='w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl active:from-blue-600 active:to-purple-600 disabled:opacity-50 touch-manipulation text-base font-medium'
            >
              <Lock size={20} />
              Unlock Bill Scanning
            </button>
          )}
          {people.length === 0 && (
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
              Add people first to enable scanning
            </p>
          )}
        </div>

        {/* Items Section */}
        <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-xl'>
          <h2 className='font-semibold mb-3 dark:text-gray-100'>Add Items</h2>
          <div className='space-y-2 mb-3'>
            <input
              type='text'
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder='Item name'
              className='w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            />
            <div className='flex gap-2'>
              <div className='flex-1'>
                <label className='text-xs text-gray-500 dark:text-gray-400 mb-1 block'>
                  Unit Price
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder='0.00'
                  className='w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                />
              </div>
              <div className='w-20'>
                <label className='text-xs text-gray-500 dark:text-gray-400 mb-1 block'>
                  Qty
                </label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  placeholder='1'
                  className='w-full px-3 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center'
                />
              </div>
              <div className='flex items-end'>
                <button
                  onClick={addItem}
                  disabled={
                    people.length === 0 || !newItemName.trim() || !newItemPrice
                  }
                  className='px-5 py-3 bg-green-600 text-white rounded-xl active:bg-green-700 disabled:opacity-50 touch-manipulation'
                >
                  <Plus size={22} />
                </button>
              </div>
            </div>
            {/* Show calculated total */}
            {newItemPrice && parseFloat(newItemPrice) > 0 && parseInt(newItemQty) > 1 && (
              <div className='text-sm text-blue-600 dark:text-blue-400 font-medium'>
                Total: {formatCurrency(parseFloat(newItemPrice) * (parseInt(newItemQty) || 1), defaultCurrency)}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className='space-y-3'>
            {items.map((item) => (
              <div
                key={item.id}
                className='bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600'
              >
                {/* Row 1: Item name + Delete */}
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <span className='font-medium dark:text-gray-100 text-base leading-tight'>
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className='text-red-500 active:text-red-700 p-1 -mr-1 -mt-1 touch-manipulation flex-shrink-0'
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Row 2: Quantity controls + Price */}
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          setItems(items.map(i =>
                            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                          ))
                        }
                      }}
                      className='w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-200 active:bg-gray-300 touch-manipulation'
                    >
                      -
                    </button>
                    <span className='w-8 text-center text-sm font-medium dark:text-gray-100'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        setItems(items.map(i =>
                          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ))
                      }}
                      className='w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-200 active:bg-gray-300 touch-manipulation'
                    >
                      +
                    </button>
                  </div>
                  <span className='text-gray-600 dark:text-gray-300 font-medium'>
                    {formatCurrency(item.price * item.quantity, defaultCurrency)}
                  </span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => {
                      const allAssigned = people.every((p) =>
                        item.assignedTo.includes(p.id)
                      )
                      setItems(
                        items.map((i) =>
                          i.id === item.id
                            ? {
                                ...i,
                                assignedTo: allAssigned
                                  ? []
                                  : people.map((p) => p.id),
                              }
                            : i
                        )
                      )
                    }}
                    className={`px-4 py-2 text-sm rounded-full transition-colors touch-manipulation font-medium ${
                      people.every((p) => item.assignedTo.includes(p.id))
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {people.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => toggleItemAssignment(item.id, person.id)}
                      className={`px-4 py-2 text-sm rounded-full transition-colors touch-manipulation ${
                        item.assignedTo.includes(person.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings (Collapsible) */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden'>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className='w-full p-4 flex items-center justify-between dark:text-gray-100'
          >
            <span className='font-semibold'>Settings</span>
            {showSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showSettings && (
            <div className='p-4 pt-0 space-y-3'>
              <div>
                <label className='block text-sm font-medium dark:text-gray-200 mb-1'>
                  Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium dark:text-gray-200 mb-1'>
                  Discount
                </label>
                <div className='flex gap-2'>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as 'percentage' | 'fixed')
                    }
                    className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  >
                    <option value='percentage'>%</option>
                    <option value='fixed'>{getDefaultCurrencySymbol()}</option>
                  </select>
                  <input
                    type='number'
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder='0'
                    className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  />
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='serviceChargeTg'
                  checked={serviceChargeEnabled}
                  onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                  className='w-5 h-5'
                />
                <label htmlFor='serviceChargeTg' className='dark:text-gray-200'>
                  Service Charge
                </label>
                {serviceChargeEnabled && (
                  <input
                    type='number'
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(e.target.value)}
                    className='w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center'
                  />
                )}
                {serviceChargeEnabled && (
                  <span className='dark:text-gray-400'>%</span>
                )}
              </div>

              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='gstTg'
                  checked={gstEnabled}
                  onChange={(e) => setGstEnabled(e.target.checked)}
                  className='w-5 h-5'
                />
                <label htmlFor='gstTg' className='dark:text-gray-200'>
                  GST
                </label>
                {gstEnabled && (
                  <input
                    type='number'
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className='w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center'
                  />
                )}
                {gstEnabled && <span className='dark:text-gray-400'>%</span>}
              </div>
            </div>
          )}
        </div>

        {/* Bill Summary */}
        <div className='bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl'>
          <h2 className='font-semibold mb-3 dark:text-gray-100'>Summary</h2>
          <div className='space-y-1 text-sm'>
            <div className='flex justify-between dark:text-gray-300'>
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal, defaultCurrency)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className='flex justify-between text-red-600'>
                <span>Discount</span>
                <span>
                  -{formatCurrency(totals.discountAmount, defaultCurrency)}
                </span>
              </div>
            )}
            {serviceChargeEnabled && totals.serviceChargeAmount > 0 && (
              <div className='flex justify-between dark:text-gray-300'>
                <span>Service ({serviceChargeRate}%)</span>
                <span>
                  {formatCurrency(totals.serviceChargeAmount, defaultCurrency)}
                </span>
              </div>
            )}
            {gstEnabled && totals.gstAmount > 0 && (
              <div className='flex justify-between dark:text-gray-300'>
                <span>GST ({gstRate}%)</span>
                <span>{formatCurrency(totals.gstAmount, defaultCurrency)}</span>
              </div>
            )}
            <div className='flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-600 dark:text-gray-100'>
              <span>Total</span>
              <span>{formatCurrency(totals.total, defaultCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Per Person */}
        {people.length > 0 && (
          <div className='bg-green-50 dark:bg-green-900/30 p-4 rounded-xl'>
            <h2 className='font-semibold mb-3 dark:text-gray-100'>
              Per Person
            </h2>
            <div className='space-y-3'>
              {people.map((person) => {
                const personTotal = calculatePersonTotal(person.id)
                const personItems = getPersonItems(person.id)

                return (
                  <div
                    key={person.id}
                    className='bg-white dark:bg-gray-700 p-3 rounded-xl'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='font-medium dark:text-gray-100'>
                        {person.name}
                      </span>
                      <span className='font-bold text-lg dark:text-gray-100'>
                        {formatCurrency(personTotal, defaultCurrency)}
                      </span>
                    </div>
                    {personItems.length > 0 && (
                      <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                        {personItems.map((item) => {
                          const itemTotal = item.price * item.quantity
                          return (
                            <div key={item.id} className='flex justify-between'>
                              <span>
                                {item.quantity > 1 && `${item.quantity}x `}
                                {item.name}
                                {item.assignedTo.length > 1 &&
                                  ` (÷${item.assignedTo.length})`}
                              </span>
                              <span>
                                {formatCurrency(
                                  itemTotal / item.assignedTo.length,
                                  defaultCurrency
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Copy FAB */}
      {items.length > 0 && people.length > 0 && (
        <button
          onClick={copyToClipboard}
          className='fixed bottom-6 right-4 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 z-50 touch-manipulation'
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Share2 size={26} />
        </button>
      )}

      {/* Copied Toast */}
      {showCopiedToast && (
        <div className='fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in'>
          <svg className='w-5 h-5 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
          <span className='text-sm font-medium'>Copied to clipboard!</span>
        </div>
      )}

      {/* Access Code Modal */}
      <AccessCodeModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={handleAccessGranted}
      />
    </div>
  )
}

export default TelegramBillSplitter
