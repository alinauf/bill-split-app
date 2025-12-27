# Bill Splitter

A Progressive Web App for splitting restaurant bills with AI-powered receipt scanning and Telegram Mini App support.

## Features

- **AI Bill Scanning** - Scan receipts using Claude Vision API to automatically extract items
- **Item-based Splitting** - Assign specific items to people for accurate splits
- **Quantity Support** - Handle items with multiple quantities
- **Tax & Charges** - Support for GST and service charges with customizable rates
- **Discounts** - Apply percentage or fixed-amount discounts
- **Multi-currency** - Convert totals to 8+ currencies
- **Telegram Mini App** - Use directly within Telegram with theme sync and sharing
- **PWA Support** - Install on mobile devices, works offline
- **Dark Mode** - Automatic theme detection

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-billsplit.git
cd the-billsplit

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for scanning) | Claude API key from [console.anthropic.com](https://console.anthropic.com/) |
| `SCAN_ACCESS_CODE` | Yes (for scanning) | Secret code users must enter to use AI scanning |
| `TELEGRAM_BOT_TOKEN` | Optional | Bot token from [@BotFather](https://t.me/BotFather) for scan notifications |
| `TELEGRAM_CHAT_ID` | Optional | Your Telegram chat ID for receiving notifications |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## AI Bill Scanning

The app uses Claude's Vision API to scan receipts and extract items automatically.

### How it works

1. User uploads a photo of their receipt
2. Image is sent to Claude Vision API (server-side)
3. AI extracts item names, prices, and quantities
4. User reviews and confirms items before adding

### Security

- The `SCAN_ACCESS_CODE` is validated server-side (never exposed to browser)
- Optional Telegram notifications alert you when scanning is used

## Telegram Mini App

Access the bill splitter directly within Telegram at `/telegram-bot`.

### Features

- Automatic theme sync (light/dark)
- Personalized greeting with Telegram username
- Share bill breakdown via Telegram
- Mobile-optimized single-column layout

### Setup

1. Deploy your app with HTTPS
2. Message [@BotFather](https://t.me/BotFather) on Telegram
3. Create a new bot or select existing one
4. Go to **Bot Settings** → **Menu Button** → **Configure**
5. Set URL to `https://your-domain.com/telegram-bot`

Your bot will now have a menu button that opens the bill splitter.

## PWA Features

- **Offline Support** - Works without internet after first visit
- **Installable** - Add to home screen on mobile devices
- **App-like Experience** - Runs in standalone mode
- **Automatic Updates** - Service worker handles updates

### Installing on Mobile

1. Open the app in your mobile browser
2. Tap "Add to Home Screen" or "Install"
3. Launch it like any other app

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scan-bill/       # Claude Vision API endpoint
│   │   └── verify-access/   # Access code validation
│   ├── telegram-bot/        # Telegram Mini App route
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── BillSplitter.tsx        # Main bill splitter
│   ├── TelegramBillSplitter.tsx # Telegram-optimized version
│   ├── BillScanner.tsx         # Receipt upload/camera UI
│   ├── ScanReviewModal.tsx     # Review scanned items
│   ├── AccessCodeModal.tsx     # Access code entry
│   └── ThemeToggle.tsx         # Dark mode toggle
public/
├── manifest.json
├── icon-192x192.png
├── icon-512x512.png
└── icon.svg
```

## Technology Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Claude Vision API** - AI receipt scanning
- **next-pwa** - Progressive Web App support
- **lucide-react** - Icons

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan-bill` | POST | Scan receipt image with Claude Vision |
| `/api/verify-access` | POST | Validate access code server-side |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
