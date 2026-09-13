export interface Person {
  id: number
  name: string
  color: number
}

export interface ItemShare {
  personId: number
  share: number
}

export interface Item {
  id: number
  name: string
  price: number
  quantity: number
  shares: ItemShare[]
}

export type DiscountType = 'percentage' | 'fixed'

export interface BillExtras {
  gstEnabled: boolean
  gstRate: string
  serviceChargeEnabled: boolean
  serviceChargeRate: string
  discountType: DiscountType
  discountValue: string
}

export interface BillDraft extends BillExtras {
  people: Person[]
  items: Item[]
  defaultCurrency: string
  convertToCurrency: string
  customRate: string
  paidBy: number | null
}

export interface Totals {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  serviceChargeAmount: number
  afterServiceCharge: number
  gstAmount: number
  total: number
}

export interface Shares {
  /** Cent-exact amount each person owes, keyed by person id. */
  byPerson: Map<number, number>
  /** Sum of every person's share. Equals `total` when nothing is unassigned. */
  assignedTotal: number
  /** Subtotal of items nobody is assigned to. */
  unassignedSubtotal: number
  /** Unassigned subtotal with its share of discount, service charge and GST. */
  unassignedAmount: number
  unassignedItems: Item[]
}

export interface Transfer {
  from: Person
  to: Person
  amount: number
}

export interface Currency {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: Currency[] = [
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

/** Units of each currency per 1 USD. */
export const EXCHANGE_RATES: Record<string, number> = {
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

const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND'])

export const PERSON_COLORS = [
  { bg: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-300', soft: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-600', hex: '#2563eb' },
  { bg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', soft: 'bg-orange-50 dark:bg-orange-900/30', ring: 'ring-orange-500', hex: '#f97316' },
  { bg: 'bg-violet-600', text: 'text-violet-700 dark:text-violet-300', soft: 'bg-violet-50 dark:bg-violet-900/30', ring: 'ring-violet-600', hex: '#7c3aed' },
  { bg: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-600', hex: '#059669' },
  { bg: 'bg-pink-600', text: 'text-pink-700 dark:text-pink-300', soft: 'bg-pink-50 dark:bg-pink-900/30', ring: 'ring-pink-600', hex: '#db2777' },
  { bg: 'bg-cyan-600', text: 'text-cyan-700 dark:text-cyan-300', soft: 'bg-cyan-50 dark:bg-cyan-900/30', ring: 'ring-cyan-600', hex: '#0891b2' },
  { bg: 'bg-amber-600', text: 'text-amber-700 dark:text-amber-300', soft: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-600', hex: '#d97706' },
  { bg: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-300', soft: 'bg-rose-50 dark:bg-rose-900/30', ring: 'ring-rose-600', hex: '#e11d48' },
]

export function personColor(person: Pick<Person, 'color'>) {
  return PERSON_COLORS[Math.abs(person.color) % PERSON_COLORS.length]
}

/** Picks the first colour index not used by anyone yet, cycling once all are taken. */
export function nextColor(people: Person[]): number {
  const used = new Set(people.map((p) => p.color % PERSON_COLORS.length))
  for (let i = 0; i < PERSON_COLORS.length; i++) {
    if (!used.has(i)) return i
  }
  return people.length % PERSON_COLORS.length
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function currencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code)
  return currency ? currency.symbol : code
}

export function decimalsFor(code: string): number {
  return ZERO_DECIMAL.has(code) ? 0 : 2
}

/** "MVR 1,234.50", "$12.00", "¥1,500". Alphabetic symbols get a space. */
export function formatCurrency(amount: number, code: string): string {
  const symbol = currencySymbol(code)
  const decimals = decimalsFor(code)
  const safe = Number.isFinite(amount) ? amount : 0
  const number = Math.abs(safe).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const sign = safe < 0 ? '-' : ''
  const space = /[A-Za-z]$/.test(symbol) ? ' ' : ''
  return `${sign}${symbol}${space}${number}`
}

/** Plain number without symbol, for receipt-style columns. */
export function formatAmount(amount: number, code: string): string {
  const decimals = decimalsFor(code)
  const safe = Number.isFinite(amount) ? amount : 0
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function defaultRate(from: string, to: string): number {
  const fromRate = EXCHANGE_RATES[from] || 1
  const toRate = EXCHANGE_RATES[to] || 1
  return toRate / fromRate
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  customRate: string
): number {
  if (!to || from === to) return amount
  const custom = parseFloat(customRate)
  if (customRate && custom > 0) return amount * custom
  return amount * defaultRate(from, to)
}

export function itemTotal(item: Item): number {
  return item.price * item.quantity
}

export function totalShares(item: Item): number {
  return item.shares.reduce((sum, s) => sum + s.share, 0)
}

export function personFraction(item: Item, personId: number): number {
  const share = item.shares.find((s) => s.personId === personId)
  const total = totalShares(item)
  if (!share || total <= 0) return 0
  return share.share / total
}

export function isEqualSplit(item: Item): boolean {
  return item.shares.every((s) => s.share === item.shares[0]?.share)
}

function num(value: string): number {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export function calculateTotals(items: Item[], extras: BillExtras): Totals {
  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0)

  let discountAmount = 0
  if (extras.discountValue) {
    discountAmount =
      extras.discountType === 'percentage'
        ? (subtotal * num(extras.discountValue)) / 100
        : num(extras.discountValue)
  }
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal)

  const afterDiscount = subtotal - discountAmount
  const serviceChargeAmount = extras.serviceChargeEnabled
    ? (afterDiscount * num(extras.serviceChargeRate)) / 100
    : 0
  const afterServiceCharge = afterDiscount + serviceChargeAmount
  const gstAmount = extras.gstEnabled
    ? (afterServiceCharge * num(extras.gstRate)) / 100
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

/**
 * Splits the bill total across people in proportion to the items they had.
 * Discount, service charge and GST all scale linearly with the subtotal, so
 * each person's share is simply their fraction of the subtotal times the total.
 * Amounts are rounded to the currency's smallest unit and any leftover unit is
 * given to the payer (or the largest share) so the shares always add up.
 */
export function computeShares(
  items: Item[],
  people: Person[],
  totals: Totals,
  paidBy: number | null,
  currency: string
): Shares {
  const factor = Math.pow(10, decimalsFor(currency))
  const byPerson = new Map<number, number>()
  const raw = new Map<number, number>()
  people.forEach((p) => raw.set(p.id, 0))

  let unassignedSubtotal = 0
  const unassignedItems: Item[] = []

  items.forEach((item) => {
    const total = itemTotal(item)
    const shares = item.shares.filter((s) => people.some((p) => p.id === s.personId))
    const partsTotal = shares.reduce((sum, s) => sum + s.share, 0)
    if (shares.length === 0 || partsTotal <= 0) {
      unassignedSubtotal += total
      unassignedItems.push(item)
      return
    }
    shares.forEach((s) => {
      raw.set(s.personId, (raw.get(s.personId) || 0) + (total * s.share) / partsTotal)
    })
  })

  const ratio = totals.subtotal > 0 ? totals.total / totals.subtotal : 0
  const unassignedAmount = unassignedSubtotal * ratio
  const assignedTotalExact = totals.total - unassignedAmount
  const assignedTotalUnits = Math.round(assignedTotalExact * factor)

  let roundedSum = 0
  let largestId: number | null = null
  let largest = -1
  people.forEach((p) => {
    const exact = (raw.get(p.id) || 0) * ratio
    const units = Math.round(exact * factor)
    byPerson.set(p.id, units)
    roundedSum += units
    if (exact > largest) {
      largest = exact
      largestId = p.id
    }
  })

  const leftover = assignedTotalUnits - roundedSum
  if (leftover !== 0 && people.length > 0) {
    const payerHasShare = paidBy !== null && (byPerson.get(paidBy) || 0) > 0
    const target = payerHasShare ? paidBy! : largestId!
    byPerson.set(target, (byPerson.get(target) || 0) + leftover)
  }

  let assignedTotal = 0
  byPerson.forEach((units, id) => {
    const amount = units / factor
    byPerson.set(id, amount)
    assignedTotal += amount
  })

  return {
    byPerson,
    assignedTotal,
    unassignedSubtotal,
    unassignedAmount,
    unassignedItems,
  }
}

export function personItems(items: Item[], personId: number): Item[] {
  return items.filter((item) => item.shares.some((s) => s.personId === personId))
}

/** Who pays whom when one person settled the whole bill. */
export function settlement(
  people: Person[],
  shares: Shares,
  paidBy: number | null
): Transfer[] {
  if (paidBy === null) return []
  const payer = people.find((p) => p.id === paidBy)
  if (!payer) return []
  return people
    .filter((p) => p.id !== paidBy)
    .map((p) => ({ from: p, to: payer, amount: shares.byPerson.get(p.id) || 0 }))
    .filter((t) => t.amount > 0)
}

export interface BreakdownInput {
  items: Item[]
  people: Person[]
  extras: BillExtras
  totals: Totals
  shares: Shares
  paidBy: number | null
  defaultCurrency: string
  convertToCurrency: string
  customRate: string
}

export function generateBreakdownText(input: BreakdownInput): string {
  const {
    items,
    people,
    extras,
    totals,
    shares,
    paidBy,
    defaultCurrency,
    convertToCurrency,
    customRate,
  } = input
  const fmt = (n: number) => formatCurrency(n, defaultCurrency)
  const converting = !!convertToCurrency && convertToCurrency !== defaultCurrency
  const conv = (n: number) =>
    formatCurrency(
      convertCurrency(n, defaultCurrency, convertToCurrency, customRate),
      convertToCurrency
    )

  const lines: string[] = ['Bill Breakdown', '================', '', 'Items:']

  items.forEach((item) => {
    const qtyPrefix = item.quantity > 1 ? `${item.quantity}x ` : ''
    let line = `${qtyPrefix}${item.name} - ${fmt(itemTotal(item))}`
    if (item.shares.length > 0) {
      const equal = isEqualSplit(item)
      const parts = totalShares(item)
      const names = item.shares
        .map((s) => {
          const name = people.find((p) => p.id === s.personId)?.name || 'Unknown'
          return equal ? name : `${name}: ${s.share}/${parts}`
        })
        .join(', ')
      line += ` (${names})`
    } else {
      line += ' (unassigned)'
    }
    lines.push(line)
  })

  lines.push('', `Subtotal: ${fmt(totals.subtotal)}`)
  if (totals.discountAmount > 0) {
    lines.push(`Discount: -${fmt(totals.discountAmount)}`)
  }
  if (extras.serviceChargeEnabled && totals.serviceChargeAmount > 0) {
    lines.push(`Service Charge (${extras.serviceChargeRate}%): ${fmt(totals.serviceChargeAmount)}`)
  }
  if (extras.gstEnabled && totals.gstAmount > 0) {
    lines.push(`GST (${extras.gstRate}%): ${fmt(totals.gstAmount)}`)
  }
  lines.push(`Total: ${fmt(totals.total)}`)
  if (converting) {
    lines.push(`Total in ${convertToCurrency}: ${conv(totals.total)}`)
  }
  if (shares.unassignedAmount > 0.005) {
    lines.push(`Unassigned: ${fmt(shares.unassignedAmount)} (${shares.unassignedItems.map((i) => i.name).join(', ')})`)
  }

  lines.push('', 'Per Person:')
  people.forEach((person) => {
    const amount = shares.byPerson.get(person.id) || 0
    let line = `${person.name}: ${fmt(amount)}`
    if (converting) line += ` (${conv(amount)})`
    lines.push(line)
  })

  const transfers = settlement(people, shares, paidBy)
  if (paidBy !== null) {
    const payerName = people.find((p) => p.id === paidBy)?.name || 'Unknown'
    lines.push('', `Paid by: ${payerName}`)
    if (transfers.length > 0) {
      lines.push('', 'Settle up:')
      transfers.forEach((t) => {
        let line = `${t.from.name} pays ${t.to.name} ${fmt(t.amount)}`
        if (converting) line += ` (${conv(t.amount)})`
        lines.push(line)
      })
    }
  }

  return lines.join('\n') + '\n'
}
