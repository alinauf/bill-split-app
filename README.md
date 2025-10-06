# Bill Splitter PWA

A Progressive Web App for splitting restaurant bills by items with support for GST, service charges, discounts, and multi-currency conversion.

## Features

- **Item-based bill splitting** - Assign specific items to people for accurate splits
- **Tax & Charges** - Support for GST and service charges with customizable rates
- **Discounts** - Apply percentage or fixed-amount discounts
- **Multi-currency** - Convert totals to 15+ currencies with custom exchange rates
- **PWA Support** - Install on mobile devices, works offline
- **Export** - Download detailed bill breakdowns as text files
- **Responsive Design** - Works seamlessly on mobile and desktop

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## PWA Features

This app is a fully-featured Progressive Web App with:

- **Offline Support** - Works without internet connection after first visit
- **Installable** - Add to home screen on mobile devices
- **App-like Experience** - Runs in standalone mode on mobile
- **Automatic Updates** - Service worker handles updates seamlessly
- **Responsive Icons** - Optimized icons for all devices (192x192, 512x512)

### Installing on Mobile

1. Open the app in your mobile browser
2. Tap the "Add to Home Screen" or "Install" prompt
3. The app will appear as a native app icon
4. Launch it like any other app

## Technology Stack

- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **next-pwa** - Progressive Web App support
- **lucide-react** - Icon library

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with PWA metadata
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   └── BillSplitter.tsx # Main bill splitter component
public/
├── manifest.json       # PWA manifest
├── icon-192x192.png   # PWA icon (192x192)
├── icon-512x512.png   # PWA icon (512x512)
└── icon.svg           # Source icon
```

## Regenerating Icons

If you need to regenerate the PWA icons:

```bash
node scripts/generate-icons.mjs
```

This will create `icon-192x192.png` and `icon-512x512.png` from `icon.svg`.
