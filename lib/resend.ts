// Resend email helper
// Set RESEND_API_KEY in Vercel env vars
import { manageUrl } from './manage-token'

export type Paper = {
  title: string
  source: string
  url: string
  summary: string
  relevance: string
  score: number
}

export type DigestData = {
  date: string
  papers: Paper[]
  emailId: string
  subjectLine: string
  borisTake?: string
  leadAnalysis?: string
  oneNumber?: string
  issueNumber?: number
}

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: 'Reprogramming',
  gene_therapy: 'Gene Therapy',
  pet_longevity: 'Pet Longevity',
  senolytics: 'Senolytics',
  epigenetic_clocks: 'Epigenetic Clocks',
}

const BASE_URL = 'https://longevitydigest.co'

const EMAIL_BASE_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#FAFAF7;font-family:Georgia,'Times New Roman',serif;color:#1B2A4A;line-height:1.65}
  .wrapper{max-width:620px;margin:0 auto;padding:40px 24px;background:#FAFAF7}
  .header{border-bottom:2px solid #1B2A4A;padding-bottom:20px;margin-bottom:32px}
  .wordmark{font-size:22px;font-weight:700;color:#1B2A4A;letter-spacing:-0.5px;text-decoration:none;font-family:Georgia,serif}
  .header-meta{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#8B7355;margin-top:6px;font-family:-apple-system,sans-serif}
  .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:12px;font-family:-apple-system,sans-serif}
  .lead-section{padding:24px 0;border-bottom:1px solid #e5e2dc;margin-bottom:24px}
  .lead-title{font-size:20px;font-weight:700;color:#1B2A4A;line-height:1.35;margin-bottom:12px}
  .lead-title a{color:#1B2A4A;text-decoration:none}
  .lead-title a:hover{color:#8B7355}
  .lead-body{font-size:15px;color:#3a4a5c;line-height:1.7;margin-bottom:12px}
  .lead-source{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#8B7355;margin-bottom:8px;font-family:-apple-system,sans-serif}
  .boris-section{background:#1B2A4A;border-radius:8px;padding:24px 28px;margin:24px 0;border-left:4px solid #8B7355}
  .boris-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:10px;font-family:-apple-system,sans-serif}
  .boris-text{font-size:14px;color:#d4d8e0;line-height:1.65;font-style:italic}
  .rest-section{padding:20px 0;border-bottom:1px solid #e5e2dc}
  .rest-section:last-of-type{border-bottom:none}
  .rest-title{font-size:16px;font-weight:700;color:#1B2A4A;margin-bottom:6px;line-height:1.4}
  .rest-title a{color:#1B2A4A;text-decoration:none}
  .rest-title a:hover{color:#8B7355}
  .rest-summary{font-size:14px;color:#64748b;line-height:1.6;margin-bottom:8px}
  .rest-source{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#8B7355;margin-bottom:6px;font-family:-apple-system,sans-serif}
  .read-more{font-size:13px;font-weight:600;color:#8B7355;text-decoration:none;font-family:-apple-system,sans-serif}
  .read-more:hover{color:#1B2A4A}
  .paper-tag{display:inline-block;background:#EDEAE3;color:#64748b;font-size:10px;font-weight:600;padding:3px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,sans-serif;margin-right:4px}
  .one-number-section{background:#f5f2ed;border-radius:8px;padding:24px 28px;margin:28px 0;text-align:center}
  .one-number-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:8px;font-family:-apple-system,sans-serif}
  .one-number-stat{font-size:28px;font-weight:700;color:#1B2A4A;margin-bottom:8px;line-height:1.2}
  .one-number-context{font-size:13px;color:#64748b;font-family:-apple-system,sans-serif}
  .cta-block{background:#1B2A4A;border-radius:12px;padding:28px;margin:32px 0;text-align:center}
  .cta-block h3{color:#FAFAF7;font-size:16px;font-weight:600;margin-bottom:8px;font-family:-apple-system,sans-serif}
  .cta-block p{color:#94a3b8;font-size:13px;margin-bottom:16px;font-family:-apple-system,sans-serif}
  .cta-btn{display:inline-block;background:#8B7355;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;font-family:-apple-system,sans-serif}
  .footer{padding-top:28px;margin-top:24px;border-top:1px solid #e5e2dc;font-size:11px;color:#94a3b8;text-align:center;font-family:-apple-system,sans-serif}
  .footer a{color:#8B7355;text-decoration:none}
`

function trackClickUrl(emailId: string, destinationUrl: string): string {
  return `${BASE_URL}/api/track/click?id=${emailId}&url=${encodeURIComponent(destinationUrl)}`
}

function trackingPixel(emailId: string): string {
  return `<img src="${BASE_URL}/api/track/open?id=${emailId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0" alt="" />`
}

function leadSectionHtml(paper: Paper, analysis: string | undefined, emailId: string): string {
  const tags = paper.relevance.split('|').map(r =>
    `<span class="paper-tag">${RELEVANCE_LABELS[r] ?? r}</span>`
  ).join('')
  const clickUrl = trackClickUrl(emailId, paper.url)
  return `
    <div class="lead-section">
      <div class="section-label">Today's Lead</div>
      <div class="lead-source">${paper.source.toUpperCase()}</div>
      <div class="lead-title"><a href="${clickUrl}">${paper.title}</a></div>
      <p class="lead-body">${analysis || paper.summary}</p>
      ${tags}
    </div>
  `
}

function borisTakeSectionHtml(borisTake: string): string {
  return `
    <div class="boris-section">
      <div class="boris-label">Boris's Take</div>
      <p class="boris-text">${borisTake}</p>
    </div>
  `
}

function restItemHtml(paper: Paper, emailId: string): string {
  const tags = paper.relevance.split('|').map(r =>
    `<span class="paper-tag">${RELEVANCE_LABELS[r] ?? r}</span>`
  ).join('')
  const clickUrl = trackClickUrl(emailId, paper.url)
  return `
    <div class="rest-section">
      <div class="rest-source">${paper.source.toUpperCase()}</div>
      <div class="rest-title"><a href="${clickUrl}">${paper.title}</a></div>
      <p class="rest-summary">${paper.summary}</p>
      ${tags}
      <div style="margin-top:8px"><a href="${clickUrl}" class="read-more">Read more →</a></div>
    </div>
  `
}

function oneNumberSectionHtml(oneNumber: string): string {
  return `
    <div class="one-number-section">
      <div class="one-number-label">One Number</div>
      <div class="one-number-stat">${oneNumber}</div>
    </div>
  `
}

function buildFullDigestHtml(digest: DigestData, email: string): string {
  const formattedDate = new Date(digest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const issueLabel = digest.issueNumber ? ` · Issue #${digest.issueNumber}` : ''

  const leadPaper = digest.papers[0]
  const restPapers = digest.papers.slice(1, 5)

  const leadHtml = leadPaper ? leadSectionHtml(leadPaper, digest.leadAnalysis, digest.emailId) : ''
  const borisHtml = digest.borisTake ? borisTakeSectionHtml(digest.borisTake) : ''

  let restHtml = ''
  if (restPapers.length > 0) {
    restHtml = `<div class="section-label" style="margin-top:24px">The Rest</div>` +
      restPapers.map(p => restItemHtml(p, digest.emailId)).join('')
  }

  const oneNumberHtml = digest.oneNumber ? oneNumberSectionHtml(digest.oneNumber) : ''

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${EMAIL_BASE_STYLES}</style></head><body>
    <div class="wrapper">
      <div class="header">
        <a href="${BASE_URL}" class="wordmark">Longevity Digest</a>
        <div class="header-meta">${formattedDate}${issueLabel}</div>
      </div>
      ${leadHtml}
      ${borisHtml}
      ${restHtml}
      ${oneNumberHtml}
      <div class="footer">
        <p><a href="${BASE_URL}">longevitydigest.co</a> · <a href="${manageUrl(email)}">Manage subscription</a></p>
      </div>
      ${trackingPixel(digest.emailId)}
    </div>
  </body></html>`
}

function buildFreeDigestHtml(digest: DigestData, email: string): string {
  const formattedDate = new Date(digest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const issueLabel = digest.issueNumber ? ` · Issue #${digest.issueNumber}` : ''

  const leadPaper = digest.papers[0]
  if (!leadPaper) return ''

  // Today's Lead: title + first 2 sentences only
  const fullText = digest.leadAnalysis || leadPaper.summary
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText]
  const teaser = sentences.slice(0, 2).join('').trim()

  const leadTags = leadPaper.relevance.split('|').map(r =>
    `<span class="paper-tag">${RELEVANCE_LABELS[r] ?? r}</span>`
  ).join('')

  // The Rest: first 2 items free, rest paywalled
  const restPapers = digest.papers.slice(1, 5)
  const freeRest = restPapers.slice(0, 2)
  const lockedRest = restPapers.slice(2)

  let restHtml = ''
  if (freeRest.length > 0) {
    restHtml += `<div class="section-label" style="margin-top:24px">The Rest</div>`
    restHtml += freeRest.map(p => restItemHtml(p, digest.emailId)).join('')
  }
  if (lockedRest.length > 0) {
    restHtml += lockedRest.map(p => `
      <div class="rest-section" style="opacity:0.5">
        <div class="rest-title">${p.title}</div>
        <p class="rest-summary" style="font-style:italic;color:#8B7355"><strong>[PAID]</strong> Full summary available to paid members. <a href="${BASE_URL}/subscribe" style="color:#8B7355;font-weight:600">Upgrade to read &rarr;</a></p>
      </div>
    `).join('')
  }

  // One Number: free
  const oneNumberHtml = digest.oneNumber ? oneNumberSectionHtml(digest.oneNumber) : ''

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${EMAIL_BASE_STYLES}</style></head><body>
    <div class="wrapper">
      <div class="header">
        <a href="${BASE_URL}" class="wordmark">Longevity Digest</a>
        <div class="header-meta">${formattedDate}${issueLabel}</div>
      </div>
      <div class="lead-section">
        <div class="section-label">Today's Lead</div>
        <div class="lead-source">${leadPaper.source.toUpperCase()}</div>
        <div class="lead-title">${leadPaper.title}</div>
        <p class="lead-body">${teaser}</p>
        <p class="lead-body" style="margin-top:8px;font-style:italic;color:#8B7355"><strong>[PAID]</strong> This analysis continues for paid members. <a href="${BASE_URL}/subscribe" style="color:#8B7355;font-weight:600">Upgrade &mdash; $12/month &rarr;</a></p>
        ${leadTags}
      </div>
      <div class="boris-section">
        <div class="boris-label">Boris's Take</div>
        <p class="boris-text">This section is available to paid members. <a href="${BASE_URL}/subscribe" style="color:#8B7355;font-weight:600">Upgrade to read &rarr;</a></p>
      </div>
      ${restHtml}
      ${oneNumberHtml}
      <div class="cta-block">
        <h3>Get the full Longevity Digest</h3>
        <p>Deep analysis, Boris's take, and every curated story — every morning.</p>
        <a href="${BASE_URL}/subscribe" class="cta-btn">Become a member &mdash; $12/month</a>
      </div>
      <div class="footer">
        <p><a href="${BASE_URL}">longevitydigest.co</a> · <a href="${manageUrl(email)}">Manage subscription</a></p>
      </div>
      ${trackingPixel(digest.emailId)}
    </div>
  </body></html>`
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
          <a href="${BASE_URL}" class="wordmark">Longevity Digest</a>
          <div class="header-meta">Welcome</div>
        </div>
        <p style="font-size:18px;font-weight:700;color:#1B2A4A;margin-bottom:12px">You're in.</p>
        <p style="font-size:15px;color:#64748b;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #e5e2dc">Starting tomorrow morning, you'll get ${isFree ? 'the lead story headline' : 'the full daily digest — deep analysis, Boris\'s take, and every curated story'}. No jargon walls, no hype.</p>
        ${isFree ? `
          <div class="cta-block">
            <h3>Want the full picture?</h3>
            <p>Members get the deep analysis, Boris's editorial take, and all curated stories every morning.</p>
            <a href="${BASE_URL}/subscribe" class="cta-btn">Become a member — $99/yr</a>
          </div>
        ` : `
          <p style="font-size:14px;color:#64748b">You're a member — the full digest is yours every morning. We're glad you're here.</p>
        `}
        <div class="footer">
          <p><a href="${BASE_URL}">longevitydigest.co</a> · <a href="${manageUrl(email)}">Manage subscription</a></p>
        </div>
      </div>
    </body></html>`,
  })
}

export async function sendDailyDigest(
  emails: string[],
  digest: DigestData,
  tier: 'free' | 'paid'
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY?.trim())

  for (const email of emails) {
    const html = tier === 'paid'
      ? buildFullDigestHtml(digest, email)
      : buildFreeDigestHtml(digest, email)

    await resend.emails.send({
      from: 'Longevity Digest <hello@longevitydigest.co>',
      to: email,
      subject: digest.subjectLine,
      html,
    })
  }
}
