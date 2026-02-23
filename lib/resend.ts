// Resend email helper
// Set RESEND_API_KEY in Vercel env vars

type Paper = {
  title: string
  source: string
  url: string
  summary: string
  relevance: string
  score: number
}

export async function sendWelcomeEmail(email: string, tier: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Longevity Digest <hello@longevitydigest.co>',
    to: email,
    subject: "You're in — here's your first Longevity Digest",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1a;color:#e2e8f0;padding:2rem;border-radius:12px">
        <h1 style="color:#22c55e;font-size:1.5rem;margin-bottom:0.5rem">🧬 Welcome to Longevity Digest</h1>
        <p style="color:#94a3b8">You'll get ${tier === 'free' ? 'one top paper' : 'the full digest'} every morning.</p>
        ${tier === 'free' ? `<p style="margin-top:1.5rem"><a href="https://longevitydigest.co/subscribe" style="background:#22c55e;color:#0a0f1a;padding:0.6rem 1.25rem;border-radius:6px;text-decoration:none;font-weight:700">Upgrade for the full digest →</a></p>` : ''}
      </div>
    `,
  })
}

export async function sendDailyDigest(emails: string[], papers: Paper[], date: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const highlighted = papers.filter(p => p.score >= 3)
  const paperHtml = highlighted.slice(0, 5).map(p => `
    <div style="background:#111827;border-left:3px solid #22c55e;border-radius:6px;padding:1rem;margin-bottom:1rem">
      <a href="${p.url}" style="color:#f1f5f9;font-weight:600;text-decoration:none">${p.title}</a>
      <p style="color:#94a3b8;font-size:0.875rem;margin:0.5rem 0">${p.summary}</p>
      <span style="color:#4ade80;font-size:0.75rem">${p.source.toUpperCase()}</span>
    </div>
  `).join('')

  // Batch send (Resend supports up to 100/batch)
  for (const email of emails) {
    await resend.emails.send({
      from: 'Longevity Digest <hello@longevitydigest.co>',
      to: email,
      subject: `🧬 Longevity Digest — ${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1a;color:#e2e8f0;padding:2rem;border-radius:12px">
          <h2 style="color:#22c55e;margin-bottom:0.25rem">🧬 Longevity Digest</h2>
          <p style="color:#64748b;font-size:0.8rem;margin-bottom:2rem">${date} · ${papers.length} papers curated</p>
          ${paperHtml}
          <hr style="border-color:#1e293b;margin:2rem 0">
          <p style="color:#475569;font-size:0.75rem">
            <a href="https://longevitydigest.co" style="color:#4ade80">longevitydigest.co</a> · 
            <a href="https://longevitydigest.co/unsubscribe?email=${email}" style="color:#475569">unsubscribe</a>
          </p>
        </div>
      `,
    })
  }
}
