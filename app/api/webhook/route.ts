import { NextRequest, NextResponse } from "next/server"
import { upgradeSubscriber } from "../../../lib/kv"

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }
  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Webhook signature mismatch" }, { status: 400 })
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { customer_email?: string; customer_details?: { email?: string } }
      const email = session.customer_email ?? session.customer_details?.email
      if (email) { await upgradeSubscriber(email.toLowerCase()); console.log(`[webhook] Upgraded: ${email}`) }
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
