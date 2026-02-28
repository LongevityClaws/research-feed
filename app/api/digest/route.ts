import { NextRequest, NextResponse } from "next/server"
import { getSubscribers } from "../../../lib/kv"
import { sendDailyDigest } from "../../../lib/resend"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-digest-secret")
  if (!process.env.DIGEST_SECRET || secret !== process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const digest = await req.json()
    if (!digest.date || !Array.isArray(digest.papers)) {
      return NextResponse.json({ error: "Invalid digest format" }, { status: 400 })
    }
    console.log(`[digest] Received for ${digest.date}: ${digest.papers.length} papers`)
    if (process.env.RESEND_API_KEY) {
      const paid = await getSubscribers("paid")
      if (paid.length > 0) { await sendDailyDigest(paid, digest.papers, digest.date); console.log(`[digest] Sent full digest to ${paid.length} paid`) }
      const free = await getSubscribers("free")
      if (free.length > 0) {
        const teaser = digest.papers.filter((p: { score: number }) => p.score >= 3).slice(0, 1)
        if (teaser.length > 0) { await sendDailyDigest(free, teaser, digest.date); console.log(`[digest] Sent teaser to ${free.length} free`) }
      }
    }
    return NextResponse.json({ ok: true, date: digest.date, count: digest.papers.length })
  } catch (err) {
    console.error("[digest] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
