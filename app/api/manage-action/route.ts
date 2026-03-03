import { NextRequest, NextResponse } from 'next/server'
import { verifyManageToken } from '../../../lib/manage-token'
import { removeSubscriber, recordSubscriberEvent, pauseSubscriber, getSubscriberInfo } from '../../../lib/kv'

export async function POST(req: NextRequest) {
  const { email, token, action } = await req.json()
  if (!email || !token || !verifyManageToken(email, token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const normalized = email.toLowerCase().trim()

  if (action === 'unsubscribe') {
    await removeSubscriber(normalized)
    await recordSubscriberEvent('unsubscribe')
    return NextResponse.json({ ok: true })
  }

  if (action === 'pause') {
    await pauseSubscriber(normalized, 14)
    return NextResponse.json({ ok: true })
  }

  if (action === 'checkout') {
    // Redirect to checkout — reuse existing checkout flow
    return NextResponse.json({ url: '/subscribe' })
  }

  if (action === 'portal') {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const info = await getSubscriberInfo(normalized)
    const customerId = info?.stripeCustomerId
    if (!customerId) {
      return NextResponse.json({ error: 'No billing record found. Please contact support.' }, { status: 404 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `https://longevitydigest.co/manage?email=${encodeURIComponent(normalized)}&token=${token}`,
    })

    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
