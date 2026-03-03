import { NextRequest, NextResponse } from 'next/server'
import { getSubscriberInfo } from '../../../lib/kv'
import { generateManageToken } from '../../../lib/manage-token'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()
  if (!email) {
    return NextResponse.redirect('https://longevitydigest.co')
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) {
    const token = generateManageToken(email)
    return NextResponse.redirect(
      `https://longevitydigest.co/manage?email=${encodeURIComponent(email)}&token=${token}&error=${encodeURIComponent('Stripe not configured')}`
    )
  }

  const info = await getSubscriberInfo(email)
  const customerId = info?.stripeCustomerId
  if (!customerId) {
    const token = generateManageToken(email)
    return NextResponse.redirect(
      `https://longevitydigest.co/manage?email=${encodeURIComponent(email)}&token=${token}&error=${encodeURIComponent('No billing record found')}`
    )
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeKey)
  const token = generateManageToken(email)
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `https://longevitydigest.co/manage?email=${encodeURIComponent(email)}&token=${token}`,
  })

  return NextResponse.redirect(session.url)
}
