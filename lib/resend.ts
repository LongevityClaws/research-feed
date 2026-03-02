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

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: 'Reprogramming',
  gene_therapy: 'Gene Therapy',
  pet_longevity: 'Pet Longevity',
  senolytics: 'Senolytics',
  epigenetic_clocks: 'Epigenetic Clocks',
}

const EMAIL_BASE_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#FAFAF5;font-family:Georgia,'Times New Roman',serif;color:#2c3e50;line-height:1.65}
  .wrapper{max-width:600px;margin:0 auto;padding:40px 24px;background:#FAFAF5}
  .header{border-bottom:2px solid #1a2744;padding-bottom:24px;margin-bottom:32px}
  .wordmark{font-size:20px;font-weight:700;color:#1a2744;letter-spacing:-0.5px;text-decoration:none;font-family:-apple-system,sans-serif}
  .date-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-top:6px;font-family:-apple-system,sans-serif}
  .intro{font-size:15px;color:#64748b;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #e5e2dc}
  .paper{padding:20px 0;border-bottom:1px solid #e5e2dc}
  .paper:last-of-type{border-bottom:none}
  .paper-source{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#b45309;margin-bottom:8px;font-family:-apple-system,sans-serif}
  .paper-title{font-size:16px;font-weight:700;color:#1a2744;text-decoration:none;display:block;margin-bottom:8px;line-height:1.4}
  .paper-title:hover{color:#b45309}
  .paper-summary{font-size:14px;color:#64748b;line-height:1.6;margin-bottom:10px}
  .paper-tag{display:inline-block;background:#EDEAE3;color:#64748b;font-size:10px;font-weight:600;padding:3px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,sans-serif;margin-right:4px}
  .cta-block{background:#1a2744;border-radius:12px;padding:28px;margin:32px 0;text-align:center}
  .cta-block h3{color:#FAFAF5;font-size:16px;font-weight:600;margin-bottom:8px;font-family:-apple-system,sans-serif}
  .cta-block p{color:#94a3b8;font-size:13px;margin-bottom:16px;font-family:-apple-system,sans-serif}
  .cta-btn{display:inline-block;background:#b45309;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;font-family:-apple-system,sans-serif}
  .footer{padding-top:24px;font-size:11px;color:#94a3b8;text-align:center;font-family:-apple-system,sans-serif}
  .footer a{color:#64748b;text-decoration:none}
`

function paperHtml(p: Paper, index: number, total: number): string {
  const tags = p.relevance.split('|').map(r =>
    `<span class="paper-tag">${RELEVANCE_LABELS[r] ?? r}</span>`
  ).join('')
  return `
    <div class="paper">
      <div class="paper-source">${p.source.toUpperCase()} · ${index + 1} of ${total}</div>
      <a href="${p.url}" class="paper-title">${p.title}</a>
      <p class="paper-summary">${p.summary}</p>
      ${tags}
    </div>
  `
}

export async function sendWelcomeEmail(email: string, tier: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY?.trim())

  const isFree = tier === 'free'
  await resend.emails.send({
    from: 'Longevity Digest <hello@longevitydigest.co>',
    to: email,
    subject: "You're in — your first Longevity Digest arrives tomorrow",
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${EMAIL_BASE_STYLES}</style></head><body>
      <div class="wrapper">
        <div class="header">
          <a href="https://longevitydigest.co" class="wordmark">Longevity Digest</a>
          <div class="date-label">Welcome</div>
        </div>
        <p style="font-size:18px;font-weight:700;color:#1a2744;margin-bottom:12px">You're in.</p>
        <p class="intro">Starting tomorrow morning, you'll get ${isFree ? 'one top longevity paper' : 'the full daily digest — every paper, scored and explained'}. No jargon walls, no hype.</p>
        ${isFree ? `
          <div class="cta-block">
            <h3>Want the full picture?</h3>
            <p>Members get all papers, relevance scoring, and a searchable archive every morning.</p>
            <a href="https://longevitydigest.co/subscribe" class="cta-btn">Become a member — $99/yr</a>
          </div>
        ` : `
          <p style="font-size:14px;color:#64748b">You're a member — the full digest is yours every morning. We're glad you're here.</p>
        `}
        <div class="footer">
          <p>Longevity Digest · <a href="https://longevitydigest.co">longevitydigest.co</a> · <a href="https://longevitydigest.co/unsubscribe?email=${encodeURIComponent(email)}">unsubscribe</a></p>
        </div>
      </div>
    </body></html>`,
  })
}

export async function sendDailyDigest(emails: string[], papers: Paper[], date: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY?.trim())

  const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const highlighted = papers.filter(p => p.score >= 3)
  const papersToShow = highlighted.length > 0 ? highlighted : papers
  const papersHtml = papersToShow.map((p, i) => paperHtml(p, i, papersToShow.length)).join('')
  const isFull = papersToShow.length >= 5

  for (const email of emails) {
    await resend.emails.send({
      from: 'Longevity Digest <hello@longevitydigest.co>',
      to: email,
      subject: `Longevity Digest — ${formattedDate}`,
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${EMAIL_BASE_STYLES}</style></head><body>
        <div class="wrapper">
          <div class="header">
            <a href="https://longevitydigest.co" class="wordmark">Longevity Digest</a>
            <div class="date-label">${formattedDate} · ${papers.length} papers curated</div>
          </div>
          <p class="intro">Today's papers from the longevity research front — scored for relevance, summarised without the jargon.</p>
          ${papersHtml}
          ${!isFull ? `
            <div class="cta-block">
              <h3>You're reading the free edition</h3>
              <p>Members get all ${papers.length} papers, relevance scoring, and the searchable archive — every morning.</p>
              <a href="https://longevitydigest.co/subscribe" class="cta-btn">Become a member — $99/yr</a>
            </div>
          ` : ''}
          <div class="footer">
            <p>Longevity Digest · <a href="https://longevitydigest.co">longevitydigest.co</a> · <a href="https://longevitydigest.co/unsubscribe?email=${encodeURIComponent(email)}">unsubscribe</a></p>
          </div>
        </div>
      </body></html>`,
    })
  }
}
