'use client'

import React, { useState } from 'react'
import { Plus, Users, Receipt, Download, Trash2, Share2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import BillScanner from './BillScanner'

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

const BillSplitter = () => {
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
  const [convertToCurrency, setConvertToCurrency] = useState('')
  const [customRate, setCustomRate] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('MVR')
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  const exchangeRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52,
    SGD: 1.34,
    INR: 83.12,
    JPY: 149.5,
    CNY: 7.23,
    KRW: 1320.0,
    MYR: 4.67,
    THB: 35.8,
    PHP: 56.5,
    VND: 24500.0,
    MVR: 15.42,
  }

  const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'MVR', symbol: 'MVR', name: 'Maldivian Rufiyaa' },
  ]

  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (!toCurrency || fromCurrency === toCurrency) return amount

    if (
      fromCurrency === defaultCurrency &&
      customRate &&
      parseFloat(customRate) > 0
    ) {
      return amount * parseFloat(customRate)
    }

    const fromRate = exchangeRates[fromCurrency] || 1
    const toRate = exchangeRates[toCurrency] || 1

    const usdAmount = amount / fromRate
    return usdAmount * toRate
  }

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find((c) => c.code === currencyCode)
    const symbol = currency ? currency.symbol : currencyCode

    if (
      currencyCode === 'JPY' ||
      currencyCode === 'KRW' ||
      currencyCode === 'VND'
    ) {
      return `${symbol}${Math.round(amount).toLocaleString()}`
    }
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
    let breakdown = 'Bill Breakdown\n'
    breakdown += '================\n\n'

    breakdown += 'Items:\n'
    items.forEach((item) => {
      const qtyPrefix = item.quantity > 1 ? `${item.quantity}x ` : ''
      const itemTotal = item.price * item.quantity
      breakdown += `${qtyPrefix}${item.name} - ${formatCurrency(
        itemTotal,
        defaultCurrency
      )}`
      if (item.assignedTo.length > 0) {
        const assignedNames = item.assignedTo
          .map((id) => people.find((p) => p.id === id)?.name || 'Unknown')
          .join(', ')
        breakdown += ` (${assignedNames})`
      }
      breakdown += '\n'
    })

    breakdown += `\nSubtotal: ${formatCurrency(
      totals.subtotal,
      defaultCurrency
    )}`
    if (totals.discountAmount > 0) {
      breakdown += `\nDiscount: -${formatCurrency(
        totals.discountAmount,
        defaultCurrency
      )}`
      breakdown += `\nAfter Discount: ${formatCurrency(
        totals.afterDiscount,
        defaultCurrency
      )}`
    }
    if (serviceChargeEnabled && totals.serviceChargeAmount > 0) {
      breakdown += `\nService Charge (${serviceChargeRate}%): ${formatCurrency(
        totals.serviceChargeAmount,
        defaultCurrency
      )}`
      breakdown += `\nAfter Service Charge: ${formatCurrency(
        totals.afterServiceCharge,
        defaultCurrency
      )}`
    }
    if (gstEnabled) {
      breakdown += `\nGST (${gstRate}%): ${formatCurrency(
        totals.gstAmount,
        defaultCurrency
      )}`
    }
    breakdown += `\nTotal: ${formatCurrency(totals.total, defaultCurrency)}`

    if (convertToCurrency && convertToCurrency !== defaultCurrency) {
      breakdown += `\nTotal in ${convertToCurrency}: ${formatCurrency(
        convertCurrency(totals.total, defaultCurrency, convertToCurrency),
        convertToCurrency
      )}`
    }

    breakdown += '\n\nPer Person:\n'
    people.forEach((person) => {
      const personTotal = calculatePersonTotal(person.id)
      breakdown += `${person.name}: ${formatCurrency(
        personTotal,
        defaultCurrency
      )}`
      if (convertToCurrency && convertToCurrency !== defaultCurrency) {
        breakdown += ` (${formatCurrency(
          convertCurrency(personTotal, defaultCurrency, convertToCurrency),
          convertToCurrency
        )})`
      }
      breakdown += '\n'
    })

    return breakdown
  }

  const copyToClipboard = async () => {
    const text = generateBreakdownText()

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
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

      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    } catch {
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

  const exportBreakdown = () => {
    const breakdown = generateBreakdownText()
    const blob = new Blob([breakdown], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill-breakdown-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const totals = calculateTotals()

  return (
    <>
      <ThemeToggle />
      <div className='max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-900 min-h-screen pb-8'>
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2'>
            <Receipt className='text-blue-600 dark:text-blue-400' />
            Bill Splitter
          </h1>
          <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
            Split restaurant bills by items with GST and discount support
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-4 sm:gap-6'>
          <div className='space-y-4 sm:space-y-6'>
            <div className='bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 dark:text-gray-100 flex items-center gap-2'>
                <Users className='text-blue-600 dark:text-blue-400 w-4 h-4 sm:w-5 sm:h-5' />
                People
              </h2>
              <div className='flex gap-2 mb-3'>
                <input
                  type='text'
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter person's name"
                  className='flex-1 min-w-0 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                  onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                />
                <button
                  onClick={addPerson}
                  className='flex-shrink-0 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className='space-y-2'>
                {people.map((person) => (
                  <div
                    key={person.id}
                    className='flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 gap-2'
                  >
                    <span className='font-medium dark:text-gray-100 text-sm sm:text-base truncate'>
                      {person.name}
                    </span>
                    <button
                      onClick={() => removePerson(person.id)}
                      className='flex-shrink-0 text-red-500 hover:text-red-700 transition-colors'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 dark:text-gray-100'>
                Items
              </h2>
              <BillScanner
                onItemsConfirmed={addItemsFromScan}
                disabled={people.length === 0}
              />
              <div className='space-y-2 mb-3'>
                <input
                  type='text'
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder='Item name'
                  className='w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                />
                <div className='flex gap-2'>
                  <div className='flex items-center gap-1 flex-1'>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Qty
                    </span>
                    <input
                      type='number'
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      placeholder='1'
                      min='1'
                      className='w-14 flex-shrink-0 px-2 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    />
                  </div>
                  <div className='flex items-center gap-1 flex-1'>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Unit Price
                    </span>
                    <input
                      type='number'
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder='0.00'
                      step='0.01'
                      className='w-full min-w-0 px-2 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    />
                  </div>
                  <button
                    onClick={addItem}
                    className='flex-shrink-0 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
                    disabled={people.length === 0}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {/* Show calculated total */}
                {newItemPrice && parseFloat(newItemPrice) > 0 && parseInt(newItemQty) > 1 && (
                  <div className='text-sm text-blue-600 dark:text-blue-400 font-medium'>
                    Total: {formatCurrency(parseFloat(newItemPrice) * (parseInt(newItemQty) || 1), defaultCurrency)}
                  </div>
                )}
              </div>
              <div className='space-y-3'>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className='bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600'
                  >
                    <div className='flex items-center justify-between mb-2 gap-2'>
                      <div className='flex-1 min-w-0 flex items-center gap-2'>
                        <div className='flex items-center gap-1 flex-shrink-0'>
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setItems(items.map(i =>
                                  i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                                ))
                              }
                            }}
                            className='w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm'
                          >
                            -
                          </button>
                          <span className='w-6 text-center text-sm font-medium dark:text-gray-100'>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              setItems(items.map(i =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                              ))
                            }}
                            className='w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm'
                          >
                            +
                          </button>
                        </div>
                        <span className='font-medium dark:text-gray-100 text-sm sm:text-base break-words flex-1'>
                          {item.name}
                        </span>
                        <span className='text-gray-600 dark:text-gray-300 text-sm sm:text-base whitespace-nowrap'>
                          {formatCurrency(item.price * item.quantity, defaultCurrency)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className='flex-shrink-0 text-red-500 hover:text-red-700 transition-colors'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className='flex flex-wrap gap-1.5'>
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
                        className={`px-2 py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap font-medium ${
                          people.every((p) => item.assignedTo.includes(p.id))
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-400'
                        }`}
                      >
                        All
                      </button>
                      {people.map((person) => (
                        <button
                          key={person.id}
                          onClick={() =>
                            toggleItemAssignment(item.id, person.id)
                          }
                          className={`px-2 py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap ${
                            item.assignedTo.includes(person.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
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

            <div className='bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 dark:text-gray-100'>
                Settings
              </h2>

              <div className='mb-3'>
                <label className='block text-xs sm:text-sm font-medium dark:text-gray-200 mb-1'>
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => {
                    setDefaultCurrency(e.target.value)
                    setCustomRate('')
                  }}
                  className='w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='mb-3'>
                <label className='block text-xs sm:text-sm font-medium dark:text-gray-200 mb-1'>
                  Convert Total to Currency
                </label>
                <select
                  value={convertToCurrency}
                  onChange={(e) => {
                    setConvertToCurrency(e.target.value)
                    setCustomRate('')
                  }}
                  className='w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  <option value=''>No conversion</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>

                {convertToCurrency && (
                  <div className='mt-2'>
                    <label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>
                      Custom Rate (1 {defaultCurrency} = ? {convertToCurrency})
                    </label>
                    <input
                      type='number'
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      placeholder={`Default: ${(
                        exchangeRates[convertToCurrency] /
                        exchangeRates[defaultCurrency]
                      ).toFixed(4)}`}
                      step='0.0001'
                      className='w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    />
                  </div>
                )}
              </div>

              <div className='mb-3'>
                <label className='block text-xs sm:text-sm font-medium dark:text-gray-200 mb-1'>
                  Discount
                </label>
                <div className='flex gap-2'>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as 'percentage' | 'fixed')
                    }
                    className='flex-shrink-0 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  >
                    <option value='percentage'>%</option>
                    <option value='fixed'>{getDefaultCurrencySymbol()}</option>
                  </select>
                  <input
                    type='number'
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder='0'
                    step='0.01'
                    className='flex-1 min-w-0 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                  />
                </div>
              </div>

              <div className='mb-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <input
                    type='checkbox'
                    id='serviceCharge'
                    checked={serviceChargeEnabled}
                    onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                    className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label
                    htmlFor='serviceCharge'
                    className='text-xs sm:text-sm font-medium dark:text-gray-200'
                  >
                    Include Service Charge
                  </label>
                </div>
                {serviceChargeEnabled && (
                  <div className='ml-6'>
                    <label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>
                      Service Charge Rate (%)
                    </label>
                    <input
                      type='number'
                      value={serviceChargeRate}
                      onChange={(e) => setServiceChargeRate(e.target.value)}
                      placeholder='10'
                      step='0.1'
                      min='0'
                      max='100'
                      className='w-20 sm:w-24 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    />
                    <span className='text-xs text-gray-600 dark:text-gray-400 ml-2'>
                      %
                    </span>
                  </div>
                )}
              </div>

              <div className='mb-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <input
                    type='checkbox'
                    id='gst'
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label
                    htmlFor='gst'
                    className='text-xs sm:text-sm font-medium dark:text-gray-200'
                  >
                    Include GST
                  </label>
                </div>
                {gstEnabled && (
                  <div className='ml-6'>
                    <label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>
                      GST Rate (%)
                    </label>
                    <input
                      type='number'
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      placeholder='8'
                      step='0.1'
                      min='0'
                      max='100'
                      className='w-20 sm:w-24 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    />
                    <span className='text-xs text-gray-600 dark:text-gray-400 ml-2'>
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-4 sm:space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 dark:text-gray-100'>
                Bill Summary
              </h2>
              <div className='space-y-2 text-sm sm:text-base'>
                <div className='flex justify-between'>
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(totals.subtotal, defaultCurrency)}
                  </span>
                </div>
                {totals.discountAmount > 0 && (
                  <>
                    <div className='flex justify-between text-red-600'>
                      <span>Discount:</span>
                      <span>
                        -
                        {formatCurrency(totals.discountAmount, defaultCurrency)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>After Discount:</span>
                      <span>
                        {formatCurrency(totals.afterDiscount, defaultCurrency)}
                      </span>
                    </div>
                  </>
                )}
                {serviceChargeEnabled && totals.serviceChargeAmount > 0 && (
                  <>
                    <div className='flex justify-between'>
                      <span>Service Charge ({serviceChargeRate}%):</span>
                      <span>
                        {formatCurrency(
                          totals.serviceChargeAmount,
                          defaultCurrency
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>After Service Charge:</span>
                      <span>
                        {formatCurrency(
                          totals.afterServiceCharge,
                          defaultCurrency
                        )}
                      </span>
                    </div>
                  </>
                )}
                {gstEnabled && (
                  <div className='flex justify-between'>
                    <span>GST ({gstRate}%):</span>
                    <span>
                      {formatCurrency(totals.gstAmount, defaultCurrency)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between font-bold text-base sm:text-lg border-t pt-2'>
                  <span>Total:</span>
                  <div className='text-right'>
                    <div>{formatCurrency(totals.total, defaultCurrency)}</div>
                    {convertToCurrency &&
                      convertToCurrency !== defaultCurrency && (
                        <div className='text-sm text-gray-600 dark:text-gray-400 font-normal'>
                          {formatCurrency(
                            convertCurrency(
                              totals.total,
                              defaultCurrency,
                              convertToCurrency
                            ),
                            convertToCurrency
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 dark:text-gray-100'>
                Per Person
              </h2>
              <div className='space-y-3'>
                {people.map((person) => {
                  const personTotal = calculatePersonTotal(person.id)
                  const personItems = getPersonItems(person.id)

                  return (
                    <div
                      key={person.id}
                      className='bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600'
                    >
                      <div className='flex justify-between items-center mb-2'>
                        <span className='font-medium dark:text-gray-100 text-sm sm:text-base'>
                          {person.name}
                        </span>
                        <div className='text-right'>
                          <div className='text-base sm:text-lg font-bold'>
                            {formatCurrency(personTotal, defaultCurrency)}
                          </div>
                          {convertToCurrency &&
                            convertToCurrency !== defaultCurrency && (
                              <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
                                {formatCurrency(
                                  convertCurrency(
                                    personTotal,
                                    defaultCurrency,
                                    convertToCurrency
                                  ),
                                  convertToCurrency
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
                        {personItems.map((item) => {
                          const itemTotal = item.price * item.quantity
                          return (
                            <div key={item.id} className='flex justify-between'>
                              <span>
                                {item.quantity > 1 && `${item.quantity}x `}
                                {item.name}{' '}
                                {item.assignedTo.length > 1
                                  ? `(split ${item.assignedTo.length})`
                                  : ''}
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
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='flex gap-2'>
              <button
                onClick={copyToClipboard}
                className='flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
                disabled={items.length === 0 || people.length === 0}
              >
                <Share2 size={16} />
                Copy
              </button>
              <button
                onClick={exportBreakdown}
                className='flex-1 px-4 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
                disabled={items.length === 0 || people.length === 0}
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copied Toast */}
      {showCopiedToast && (
        <div className='fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in'>
          <svg className='w-5 h-5 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
          <span className='text-sm font-medium'>Copied to clipboard!</span>
        </div>
      )}
    </>
  )
}

export default BillSplitter
