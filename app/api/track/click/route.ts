import { NextRequest, NextResponse } from "next/server"
import { trackClick } from "../../../../lib/kv"

export async function GET(req: NextRequest) {
  const emailId = req.nextUrl.searchParams.get("id")
  const url = req.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  if (emailId) {
    trackClick(emailId, url).catch(err => console.error("[track/click] Error:", err))
  }

  return NextResponse.redirect(url, 302)
}
