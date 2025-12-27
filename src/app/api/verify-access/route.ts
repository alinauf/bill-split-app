import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // Server-side validation - this env var is NOT exposed to client
    const validCode = process.env.SCAN_ACCESS_CODE

    if (!validCode) {
      return NextResponse.json(
        { error: 'Access code not configured' },
        { status: 500 }
      )
    }

    if (code === validCode) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false }, { status: 401 })
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
