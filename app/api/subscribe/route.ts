import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "../../../lib/resend"
import { addSubscriber, isSubscribed, recordSubscriberEvent } from "../../../lib/kv"

export async function POST(req: NextRequest) {
  try {
    const { email, tier = "free" } = await req.json()
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    const normalised = email.toLowerCase().trim()
    const already = await isSubscribed(normalised)
    if (already) return NextResponse.json({ ok: true, message: "Already subscribed" })
    await addSubscriber(normalised, "free")
    await recordSubscriberEvent("subscribe")
    if (process.env.RESEND_API_KEY) {
      try { await sendWelcomeEmail(normalised, tier) } catch (err) { console.error("[subscribe] Welcome email failed:", err) }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
