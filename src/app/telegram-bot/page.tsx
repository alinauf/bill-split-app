import TelegramBillSplitter from '@/components/TelegramBillSplitter'

export const metadata = {
  title: 'Bill Splitter - Telegram',
  description: 'Split bills with friends in Telegram',
}

export default function TelegramBotPage() {
  return <TelegramBillSplitter />
}
