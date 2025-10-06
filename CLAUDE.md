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

**Components**:
- `src/components/BillSplitter.tsx` - Main bill splitter component (client-side)
  - Manages people, items, and assignments
  - Calculates totals with GST, service charges, and discounts
  - Multi-currency conversion support (15+ currencies)
  - Export functionality for bill breakdowns
- `src/components/ThemeToggle.tsx` - Dark mode toggle component (client-side)
  - Persists theme preference in localStorage
  - Respects system color scheme preference
  - Toggles `.dark` class on `<html>` element

## Key Files

- `src/app/layout.tsx` - Root layout with PWA metadata and viewport config
- `src/app/page.tsx` - Homepage that renders BillSplitter component
- `src/components/BillSplitter.tsx` - Main application logic (client component)
- `src/components/ThemeToggle.tsx` - Dark mode toggle (client component)
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
