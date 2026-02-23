import { NextRequest, NextResponse } from 'next/server'

// Stripe webhook — verifies signature, handles subscription events
// Set STRIPE_WEBHOOK_SECRET in Vercel env vars
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature mismatch' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as { customer_email?: string }
      console.log(`[webhook] New subscriber: ${session.customer_email}`)
      // TODO: Add to subscriber list / KV store
      break
    }
    case 'customer.subscription.deleted': {
      console.log('[webhook] Subscription cancelled')
      // TODO: Remove from active subscribers
      break
    }
  }

  return NextResponse.json({ received: true })
}
