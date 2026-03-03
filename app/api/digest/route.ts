import { NextRequest, NextResponse } from "next/server"
import { getSubscribers, trackEmailSend, getNextIssueNumber } from "../../../lib/kv"
import { sendDailyDigest } from "../../../lib/resend"
import type { DigestData } from "../../../lib/resend"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-digest-secret")
  const digestSecret = process.env.DIGEST_SECRET?.trim()
  if (!digestSecret || secret !== digestSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.date || !Array.isArray(body.papers)) {
      return NextResponse.json({ error: "Invalid digest format" }, { status: 400 })
    }
    console.log(`[digest] Received for ${body.date}: ${body.papers.length} papers`)

    const emailId = body.emailId || crypto.randomUUID()
    const issueNumber = await getNextIssueNumber()

    const digest: DigestData = {
      date: body.date,
      papers: body.papers,
      emailId,
      subjectLine: body.subjectLine || `Longevity Digest — ${new Date(body.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      borisTake: body.borisTake,
      leadAnalysis: body.leadAnalysis,
      oneNumber: body.oneNumber,
      issueNumber,
    }

    if (process.env.RESEND_API_KEY?.trim()) {
      const paid = await getSubscribers("paid")
      const free = await getSubscribers("free")
      const totalRecipients = paid.length + free.length

      if (paid.length > 0) {
        await sendDailyDigest(paid, digest, "paid")
        console.log(`[digest] Sent full digest to ${paid.length} paid`)
      }
      if (free.length > 0) {
        await sendDailyDigest(free, digest, "free")
        console.log(`[digest] Sent teaser to ${free.length} free`)
      }

      // Track the send
      await trackEmailSend(emailId, {
        date: body.date,
        subject: digest.subjectLine,
        recipientCount: totalRecipients,
        sentAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      date: body.date,
      emailId,
      issueNumber,
      count: body.papers.length,
    })
  } catch (err) {
    console.error("[digest] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
