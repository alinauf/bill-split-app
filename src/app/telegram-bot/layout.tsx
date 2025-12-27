'use client'

import { type PropsWithChildren } from 'react'
import Script from 'next/script'

export default function TelegramBotLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  )
}
