import TelegramBillSplitter from '@/components/TelegramBillSplitter'
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata = {
  title: 'Bill Splitter - Telegram',
  description: 'Split bills with friends in Telegram',
}

export default function TelegramBotPage() {
  return <TelegramBillSplitter />
}
