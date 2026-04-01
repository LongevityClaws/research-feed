import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { markProviderEmailEvent } from "../../../../lib/kv"

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  try {
    const payload = await req.text()
    let event: Record<string, unknown>

    if (webhookSecret) {
      const resend = new Resend(process.env.RESEND_API_KEY?.trim()) as unknown as {
        webhooks: {
          verify: (args: {
            payload: string
            headers: Record<string, string>
            webhookSecret: string
          }) => unknown
        }
      }
      event = resend.webhooks.verify({
        payload,
        headers: {
          "svix-id": req.headers.get("svix-id") ?? "",
          "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
          "svix-signature": req.headers.get("svix-signature") ?? "",
        },
        webhookSecret,
      }) as Record<string, unknown>
    } else {
      console.warn("[resend webhook] RESEND_WEBHOOK_SECRET missing — accepting unverified event")
      event = JSON.parse(payload) as Record<string, unknown>
    }

    const type = String(event.type ?? event.object ?? "unknown")
    const data = (event.data ?? {}) as Record<string, unknown>
    const providerMessageId = String(data.email_id ?? data.id ?? "")

    if (!providerMessageId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "missing provider message id" })
    }

    await markProviderEmailEvent(providerMessageId, type, data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[resend webhook] verification failed", error)
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }
}
