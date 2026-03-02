import { NextRequest, NextResponse } from 'next/server'

// Stripe price IDs — set these in Vercel env vars once Boris approves
// STRIPE_PRICE_MONTHLY=price_xxx
// STRIPE_PRICE_ANNUAL=price_xxx
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured yet' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeKey)

  const { plan = 'monthly', email } = await req.json()
  const priceId = plan === 'annual'
    ? process.env.STRIPE_PRICE_ANNUAL?.trim()!
    : process.env.STRIPE_PRICE_MONTHLY?.trim()!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL?.trim()}/subscribed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL?.trim()}/?cancelled=1`,
    metadata: { plan },
  })

  return NextResponse.json({ url: session.url })
}
