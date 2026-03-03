#!/usr/bin/env npx tsx
/**
 * Send daily digest emails to all subscribers.
 * Reads data/latest.json and POSTs to the deployed /api/digest endpoint.
 * Requires DIGEST_SECRET env var (same as the one set on Vercel).
 */
import { readFileSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_URL?.trim() || 'https://longevitydigest.co'
const DIGEST_SECRET = process.env.DIGEST_SECRET?.trim()

async function main() {
  if (!DIGEST_SECRET) {
    console.error('[send-digest] DIGEST_SECRET not set — cannot authenticate with API.')
    process.exit(1)
  }

  // Read latest digest data
  const dataPath = join(__dirname, '..', 'data', 'latest.json')
  let latestData: Record<string, unknown>
  try {
    latestData = JSON.parse(readFileSync(dataPath, 'utf-8'))
  } catch (err) {
    console.error(`[send-digest] Failed to read ${dataPath}:`, err)
    process.exit(1)
  }

  const { date, papers } = latestData as { date: string; papers: unknown[] }
  if (!date || !Array.isArray(papers) || papers.length === 0) {
    console.log('[send-digest] No papers in latest.json — skipping send.')
    process.exit(0)
  }

  console.log(`[send-digest] Sending digest for ${date} (${papers.length} papers)`)

  // POST to deployed digest endpoint
  const url = `${BASE_URL}/api/digest`
  const body = {
    date,
    papers,
    // Optional fields — include if present in latest.json
    ...(latestData.borisTake ? { borisTake: latestData.borisTake } : {}),
    ...(latestData.leadAnalysis ? { leadAnalysis: latestData.leadAnalysis } : {}),
    ...(latestData.oneNumber ? { oneNumber: latestData.oneNumber } : {}),
    ...(latestData.subjectLine ? { subjectLine: latestData.subjectLine } : {}),
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-digest-secret': DIGEST_SECRET,
    },
    body: JSON.stringify(body),
  })

  const result = await res.json()

  if (!res.ok) {
    console.error(`[send-digest] API returned ${res.status}:`, result)
    process.exit(1)
  }

  console.log(`[send-digest] Success:`, result)
  console.log(`  emailId: ${result.emailId}`)
  console.log(`  issueNumber: ${result.issueNumber}`)
  console.log(`  papers: ${result.count}`)
}

main().catch(err => {
  console.error('[send-digest] Fatal error:', err)
  process.exit(1)
})
