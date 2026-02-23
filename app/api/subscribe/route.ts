import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '../../../lib/resend'

// In production: persist to DB (e.g. Vercel KV, PlanetScale, Neon)
// For v1, we'll just send the welcome email
export async function POST(req: NextRequest) {
  try {
    const { email, tier = 'free' } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Send welcome email via Resend (no-op if RESEND_API_KEY not set)
    if (process.env.RESEND_API_KEY) {
      await sendWelcomeEmail(email, tier)
    } else {
      console.log(`[subscribe] Would email ${email} (${tier}) — RESEND_API_KEY not set`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[subscribe] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
