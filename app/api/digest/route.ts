import { NextRequest, NextResponse } from "next/server"
import { getSubscribers, trackEmailSend, getNextIssueNumber, isSubscriberPaused, getDigestMetaByDate } from "../../../lib/kv"
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

    const existing = await getDigestMetaByDate(body.date)
    const existingAccepted = Number(existing?.acceptedCount ?? 0)
    if (existing?.emailId && existingAccepted > 0) {
      return NextResponse.json({
        ok: true,
        date: body.date,
        emailId: existing.emailId,
        issueNumber: existing.issueNumber ? Number(existing.issueNumber) : undefined,
        count: body.papers.length,
        idempotent: true,
        acceptedCount: existingAccepted,
      })
    }

    // Guardrail: warn on missing editorial fields
    const missing = ['borisTake', 'leadAnalysis', 'oneNumber'].filter(f => !body[f])
    if (missing.length > 0) {
      console.warn(`[digest] ⚠️ Missing editorial fields: ${missing.join(', ')} — email will render without them`)
    }

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

    let totalRecipients = 0
    let acceptedCount = 0
    const recipientResults: Awaited<ReturnType<typeof sendDailyDigest>> = []

    if (process.env.RESEND_API_KEY?.trim()) {
      const allPaid = await getSubscribers("paid")
      const allFree = await getSubscribers("free")

      // Filter out paused subscribers
      const paidChecks = await Promise.all(allPaid.map(async e => ({ e, paused: await isSubscriberPaused(e) })))
      const freeChecks = await Promise.all(allFree.map(async e => ({ e, paused: await isSubscriberPaused(e) })))
      const paid = paidChecks.filter(x => !x.paused).map(x => x.e)
      const free = freeChecks.filter(x => !x.paused).map(x => x.e)
      totalRecipients = paid.length + free.length

      if (paid.length > 0) {
        const paidResults = await sendDailyDigest(paid, digest, "paid")
        recipientResults.push(...paidResults)
        console.log(`[digest] Attempted full digest to ${paid.length} paid (${paidResults.filter(x => x.accepted).length} accepted)`)
      }
      if (free.length > 0) {
        const freeResults = await sendDailyDigest(free, digest, "free")
        recipientResults.push(...freeResults)
        console.log(`[digest] Attempted teaser to ${free.length} free (${freeResults.filter(x => x.accepted).length} accepted)`)
      }

      acceptedCount = recipientResults.filter(x => x.accepted).length
      if (totalRecipients > 0 && acceptedCount === 0) {
        return NextResponse.json({ error: "No recipient was accepted by Resend", results: recipientResults }, { status: 502 })
      }

      // Track the send
      await trackEmailSend(emailId, {
        date: body.date,
        subject: digest.subjectLine,
        recipientCount: totalRecipients,
        sentAt: new Date().toISOString(),
        issueNumber,
        acceptedCount,
        providerMessageIds: recipientResults.map(x => x.providerMessageId).filter(Boolean) as string[],
        recipientResults,
      })
    }

    return NextResponse.json({
      ok: true,
      date: body.date,
      emailId,
      issueNumber,
      count: body.papers.length,
      recipientCount: totalRecipients,
      acceptedCount,
    })
  } catch (err) {
    console.error("[digest] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
