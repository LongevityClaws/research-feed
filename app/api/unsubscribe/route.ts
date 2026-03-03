import { NextRequest } from "next/server"
import { removeSubscriber, recordSubscriberEvent } from "../../../lib/kv"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email || !email.includes("@")) return new Response("Invalid unsubscribe link.", { status: 400 })
  await removeSubscriber(email.toLowerCase().trim())
  await recordSubscriberEvent("unsubscribe")
  return new Response(
    `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:sans-serif;max-width:480px;margin:4rem auto;text-align:center;background:#0a0f1a;color:#e2e8f0;padding:2rem;border-radius:12px"><h2 style="color:#22c55e">Unsubscribed</h2><p style="color:#94a3b8">You have been removed from Longevity Digest.</p><p><a href="https://longevitydigest.co" style="color:#22c55e">Back to homepage</a></p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  )
}
