import { NextRequest, NextResponse } from "next/server"
import { upgradeSubscriber, setStripeCustomerId } from "../../../lib/kv"

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }
  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(stripeKey)
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Webhook signature mismatch" }, { status: 400 })
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { customer_email?: string; customer_details?: { email?: string }; customer?: string }
      const email = session.customer_email ?? session.customer_details?.email
      if (email) {
        await upgradeSubscriber(email.toLowerCase())
        if (session.customer) await setStripeCustomerId(email.toLowerCase(), session.customer)
        console.log(`[webhook] Upgraded: ${email}, customer: ${session.customer}`)
      }
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as { customer?: string }
      console.log(`[webhook] Subscription cancelled: ${sub.customer}`)
      break
    }
  }
  return NextResponse.json({ received: true })
}
