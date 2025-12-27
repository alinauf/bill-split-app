import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export interface ScannedItem {
  name: string
  price: number
  quantity: number
  confidence: 'high' | 'medium' | 'low'
}

export interface ScanResponse {
  items: ScannedItem[]
  warnings?: string[]
}

const anthropic = new Anthropic()

async function sendTelegramNotification(items: ScannedItem[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log('Telegram notification skipped: missing bot token or chat ID')
    return
  }

  const total = items.reduce((sum, item) => sum + item.price, 0)
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const itemsList = items
    .map((item) => `• ${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.name} - $${item.price.toFixed(2)}`)
    .join('\n')

  const message = `🧾 <b>Bill Scanned</b>

<b>Items:</b>
${itemsList}

<b>Total:</b> $${total.toFixed(2)}
<b>Time:</b> ${timestamp}`

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mediaType } = body as {
      image: string
      mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    }

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: image and mediaType' },
        { status: 400 }
      )
    }

    const validMediaTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'Invalid media type. Supported: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image,
              },
            },
            {
              type: 'text',
              text: `Extract all line items from this bill/receipt image. Focus on individual food/drink items or products with their prices.

Rules:
1. Extract ONLY purchasable items with prices - ignore headers, footers, totals, tax lines, subtotals, and service charges
2. For each item, provide the item name, the TOTAL price for that line, and quantity if shown
3. If an item shows "Pizza x2 $24.00", extract as: name="Pizza", price=24.00, quantity=2
4. If no quantity is shown, use quantity=1
5. Price should be the TOTAL for that line item (not per-unit price)
6. If a price is unclear or ambiguous, mark confidence as "low"
7. Prices should be numbers only (no currency symbols)

Output ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{"items":[{"name":"Item Name","price":12.99,"quantity":1,"confidence":"high"}],"warnings":["any issues encountered"]}`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response type from AI' },
        { status: 500 }
      )
    }

    // Try to parse the JSON response
    let parsed: ScanResponse
    try {
      // Clean up the response in case it has markdown code blocks
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      parsed = JSON.parse(jsonText)
    } catch {
      console.error('Failed to parse AI response:', content.text)
      return NextResponse.json(
        { error: 'Failed to parse bill items. Please try a clearer photo.' },
        { status: 422 }
      )
    }

    // Validate the parsed response
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 422 }
      )
    }

    // Ensure all items have required fields
    const validatedItems: ScannedItem[] = parsed.items
      .filter((item) => item.name && typeof item.price === 'number')
      .map((item) => ({
        name: String(item.name).trim(),
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        confidence: item.confidence || 'medium',
      }))

    // Send Telegram notification (fire-and-forget)
    sendTelegramNotification(validatedItems).catch(() => {})

    return NextResponse.json({
      items: validatedItems,
      warnings: parsed.warnings || [],
    })
  } catch (error) {
    console.error('Scan error:', error)

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'API key not configured. Please check server configuration.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
