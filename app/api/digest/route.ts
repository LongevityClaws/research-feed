import { NextRequest, NextResponse } from 'next/server'

// Gamba POSTs the daily digest JSON here
// Protected by DIGEST_SECRET env var
// Note: Vercel functions are stateless — this writes to /tmp (ephemeral)
// For production: write to Vercel KV or commit via GitHub API
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-digest-secret')
  if (!process.env.DIGEST_SECRET || secret !== process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const digest = await req.json()
    if (!digest.date || !Array.isArray(digest.papers)) {
      return NextResponse.json({ error: 'Invalid digest format' }, { status: 400 })
    }

    // Log for now — in production this triggers email send + KV update
    console.log(`[digest] Received digest for ${digest.date}: ${digest.papers.length} papers`)

    // TODO: write to Vercel KV, trigger email delivery to subscribers

    return NextResponse.json({ ok: true, date: digest.date, count: digest.papers.length })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
