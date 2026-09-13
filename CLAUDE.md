# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) for splitting restaurant bills, built with Next.js 15.5, TypeScript, React 19, and Tailwind CSS v4. It uses the App Router architecture, Turbopack for build tooling, and next-pwa for PWA functionality.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start
```

The dev server runs on http://localhost:3000 with hot-reloading enabled.

## Architecture

**Framework**: Next.js 15.5 with App Router (not Pages Router)

- App directory: `src/app/`
- Uses React Server Components by default
- File-based routing in `src/app/`

**Styling**: Tailwind CSS v4 with PostCSS

- Global styles: `src/app/globals.css`
- PostCSS config: `postcss.config.mjs`
- Uses `@tailwindcss/postcss` plugin
- Custom dark mode variant: `@custom-variant dark (&:is(.dark *))` in globals.css
- Dark mode toggled via `.dark` class on `<html>` element (managed by ThemeToggle component)

**TypeScript Configuration**:

- Import alias: `@/*` maps to `./src/*`
- Target: ES2017
- Strict mode enabled

**Fonts**: Uses next/font with Geist Sans and Geist Mono from Google Fonts

- Configured in `src/app/layout.tsx`
- Loaded as CSS variables: `--font-geist-sans` and `--font-geist-mono`

**PWA Configuration**: Uses @ducanh2912/next-pwa
- PWA manifest: `public/manifest.json`
- Service worker configured in `next.config.ts`
- Icons: `public/icon-192x192.png`, `public/icon-512x512.png`
- Offline support enabled (disabled in development mode)
- Regenerate icons: `node scripts/generate-icons.mjs`

**State** (`src/hooks/useBill.ts`): one hook owns the bill draft (people, items,
extras, currency, payer), autosaves it to localStorage (`billsplit-draft`), and
exposes every action plus derived totals/shares. Both entry points use it.

**Components** (all client components in `src/components/`):
- `BillSplitter.tsx` - Web app shell (`/`): header with theme toggle, `PeopleBar`,
  and a layout picked with `useMediaQuery` from `BillViews.tsx`:
  - phones (< 768px): `ReceiptView` (list of `ItemRow`s) with a `StickyBar`
  - wide screens: `GridView` (`SplitGrid` items x people table, pinned summary column)
- `TelegramBillSplitter.tsx` - Telegram mini app shell (`/telegram-bot`): same
  `ReceiptView`, plus WebApp init/expand, colour-scheme sync, light haptics on
  assignment, "Send breakdown to a chat" via `t.me/share/url`, and the scan
  access-code gate (`AccessCodeModal` + `/api/verify-access`, sessionStorage)
- `ScannerBlock.tsx` - "Scan a receipt" link that expands into `BillScanner`
  (accepts a `locked` node for the Telegram gate)
- `PeopleBar.tsx` - Colour-coded person chips (rename on tap, remove, recent names)
- `ItemRow.tsx` / `SplitGrid.tsx` - Item lists with tap-to-assign avatars, inline
  editing via `ItemEditor.tsx`, and amber highlighting for unassigned items
- `SplitSheet.tsx` - Bottom sheet for unequal splits (parts per person)
- `SummaryCard.tsx` - Totals, extras as chips (service charge, GST, discount),
  currency and conversion, and an "Unassigned" warning line
- `SettleUp.tsx` - Per-person amounts, "who paid" and settle-up transfers,
  copy/export
- `AddItemForm.tsx`, `EmptyState.tsx`, `StickyBar.tsx`, `HistoryPanel.tsx`,
  `Toast.tsx` (undo/copied toasts), `Avatar.tsx`
- `BillScanner.tsx` + `ScanReviewModal.tsx` - Receipt scanning via `/api/scan-bill`
- `ThemeToggle.tsx` - Dark mode toggle rendered in the page header
  (persists in localStorage, respects system preference, toggles `.dark` on `<html>`)

**Shared logic** (`src/lib/`):
- `bill.ts` - Types, currencies/rates, `formatCurrency` (space after alphabetic
  symbols, thousands separators), `calculateTotals`, `computeShares` (per-person
  amounts rounded to the currency's smallest unit so they always add up; leftover
  goes to the payer), `settlement`, `generateBreakdownText`
- `storage.ts` - Safe localStorage helpers

## Key Files

- `src/app/layout.tsx` - Root layout with PWA metadata and viewport config
- `src/app/page.tsx` - Homepage that renders BillSplitter component
- `src/components/BillSplitter.tsx` - Main application state and layout switch
- `src/lib/bill.ts` - Bill maths and formatting shared by the components
- `next.config.ts` - Next.js + PWA configuration
- `public/manifest.json` - PWA manifest with app metadata
- `scripts/generate-icons.mjs` - Script to generate PWA icons from icon.svg
- `tsconfig.json` - TypeScript configuration with path aliases

## Icon Management

To regenerate PWA icons after updating `public/icon.svg`:

```bash
node scripts/generate-icons.mjs
```

This creates optimized `icon-192x192.png` and `icon-512x512.png` from the source SVG.
