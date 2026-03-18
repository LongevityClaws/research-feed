// Resend email helper
import { manageUrl } from './manage-token'

export type Paper = {
  title: string
  source: string
  url: string
  summary: string
  relevance?: string
  tags?: string[]
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
// These must match www.longevitydigest.co exactly.
// Source of truth: EMAIL_SOP.md

const C = {
  navy:       '#0B1F3A',   // primary: headers, wordmark, dark CTAs
  gold:       '#C9A96E',   // accent: section labels, links, dividers
  cream:      '#F8F5EF',   // page background
  cardBg:     '#EDE8DF',   // subtle card background (Boris Take, One Number)
  textPrimary:'#0B1F3A',   // headlines
  textBody:   '#374151',   // body copy — dark grey, not navy
  textMuted:  '#6B7280',   // secondary / summaries
  textSubtle: '#9CA3AF',   // footer, meta
  divider:    '#E0D9CC',   // warm grey dividers
}

// ─── Typography ───────────────────────────────────────────────────────────────
// Serif (Georgia): wordmark, headlines, body/analysis copy
// System-ui: section labels, tags, source lines, footer, UI elements only

const EMAIL_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.cream};font-family:Georgia,'Times New Roman',serif;color:${C.textBody};line-height:1.7;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly}
  .wrapper{max-width:620px;margin:0 auto;padding:40px 24px}
  
  /* Header */
  .header{padding-bottom:20px;margin-bottom:32px;border-bottom:2px solid ${C.navy}}
  .wordmark{font-size:24px;font-weight:700;color:${C.navy};letter-spacing:-0.5px;text-decoration:none;font-family:Georgia,serif;line-height:1}
  .header-meta{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${C.gold};margin-top:8px;font-family:system-ui,-apple-system,sans-serif}
  
  /* Section labels — gold caps, consistent everywhere */
  .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:${C.gold};margin-bottom:12px;font-family:system-ui,-apple-system,sans-serif}
  
  /* Source line — smaller, muted */
  .source{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:${C.textMuted};margin-bottom:8px;font-family:system-ui,-apple-system,sans-serif}
  
  /* Lead section */
  .lead{padding:28px 0;border-bottom:1px solid ${C.divider};margin-bottom:28px}
  .lead-title{font-size:22px;font-weight:700;color:${C.textPrimary};line-height:1.3;margin-bottom:14px}
  .lead-title a{color:${C.textPrimary};text-decoration:none}
  .lead-title a:hover{color:${C.gold}}
  .lead-body{font-size:15px;color:${C.textBody};line-height:1.75;margin-bottom:14px}
  
  /* Boris's Take */
  .boris{background:${C.navy};padding:24px 28px;margin:0 0 28px;border-left:3px solid ${C.gold}}
  .boris .label{color:${C.gold}}
  .boris-text{font-size:15px;color:#CBD5E1;line-height:1.75;font-style:italic}
  
  /* The Rest items */
  .rest-item{padding:20px 0;border-bottom:1px solid ${C.divider}}
  .rest-item:last-of-type{border-bottom:none}
  .rest-title{font-size:17px;font-weight:700;color:${C.textPrimary};line-height:1.35;margin-bottom:8px}
  .rest-title a{color:${C.textPrimary};text-decoration:none}
  .rest-title a:hover{color:${C.gold}}
  .rest-body{font-size:15px;color:${C.textMuted};line-height:1.7;margin-bottom:10px}
  .read-more{font-size:13px;font-weight:600;color:${C.gold};text-decoration:none;font-family:system-ui,-apple-system,sans-serif}
  
  /* Tag chips */
  .tag{display:inline-block;background:${C.cardBg};color:${C.textMuted};font-size:10px;font-weight:600;padding:3px 8px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui,-apple-system,sans-serif;margin-right:4px;margin-top:8px}
  
  /* One Number */
  .one-number{background:${C.cardBg};padding:28px;margin:28px 0;text-align:center}
  .one-number-stat{font-size:32px;font-weight:700;color:${C.navy};margin:10px 0 6px;line-height:1.1;font-family:Georgia,serif}
  .one-number-context{font-size:13px;color:${C.textMuted};font-family:system-ui,-apple-system,sans-serif}
  
  /* CTA block (free tier only) */
  .cta{background:${C.navy};padding:28px;margin:32px 0;text-align:center}
  .cta h3{color:${C.cream};font-size:17px;font-weight:700;margin-bottom:8px;font-family:Georgia,serif}
  .cta p{color:#94A3B8;font-size:13px;margin-bottom:18px;font-family:system-ui,-apple-system,sans-serif}
  .cta-btn{display:inline-block;background:${C.gold};color:${C.navy};text-decoration:none;padding:11px 26px;font-size:14px;font-weight:700;font-family:system-ui,-apple-system,sans-serif}
  
  /* Paywall line */
  .paywall{font-size:14px;color:${C.gold};font-style:italic;margin-top:8px}
  .paywall a{color:${C.gold};font-weight:700}
  
  /* Footer */
  .footer{padding-top:24px;margin-top:28px;border-top:1px solid ${C.divider};font-size:11px;color:${C.textSubtle};text-align:center;font-family:system-ui,-apple-system,sans-serif;line-height:1.6}
  .footer a{color:${C.gold};text-decoration:none}
`

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: 'Reprogramming',
  gene_therapy:          'Gene Therapy',
  pet_longevity:         'Pet Longevity',
  senolytics:            'Senolytics',
  epigenetic_clocks:     'Epigenetic Clocks',
  microbiome:            'Microbiome',
  inflammation:          'Inflammation',
  mitochondria:          'Mitochondria',
  rapamycin:             'Rapamycin',
}

const BASE_URL = 'https://longevitydigest.co'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trackClickUrl(emailId: string, url: string): string {
  return `${BASE_URL}/api/track/click?id=${emailId}&url=${encodeURIComponent(url)}`
}

function trackingPixel(emailId: string): string {
  return `<img src="${BASE_URL}/api/track/open?id=${emailId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0" alt="" />`
}

function tags(relevance: string | string[] | undefined): string {
  if (!relevance) return ''
  const items = Array.isArray(relevance)
    ? relevance
    : relevance.split('|').map(r => r.trim())
  return items.map(r => `<span class="tag">${RELEVANCE_LABELS[r.trim()] ?? r.trim()}</span>`).join('')
}

function formattedDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ─── Section builders ─────────────────────────────────────────────────────────

function leadHtml(paper: Paper, analysis: string | undefined, emailId: string): string {
  const href = trackClickUrl(emailId, paper.url)
  return `
    <div class="lead">
      <div class="label">Today's Lead</div>
      <div class="source">${paper.source.toUpperCase()}</div>
      <div class="lead-title"><a href="${href}">${paper.title}</a></div>
      <p class="lead-body">${analysis || paper.summary}</p>
      <div>${tags(paper.tags ?? paper.relevance)}</div>
    </div>`
}

function borisTakeHtml(take: string): string {
  return `
    <div class="boris">
      <div class="label">Boris's Take</div>
      <p class="boris-text">${take}</p>
    </div>`
}

function restItemHtml(paper: Paper, emailId: string): string {
  const href = trackClickUrl(emailId, paper.url)
  return `
    <div class="rest-item">
      <div class="source">${paper.source.toUpperCase()}</div>
      <div class="rest-title"><a href="${href}">${paper.title}</a></div>
      <p class="rest-body">${paper.summary}</p>
      <div>${tags(paper.tags ?? paper.relevance)}</div>
      <div style="margin-top:10px"><a href="${href}" class="read-more">Read →</a></div>
    </div>`
}

function oneNumberHtml(content: string): string {
  // Expected format: "144M | Dollars committed by ARPA-H to healthspan trials"
  const [stat, context] = content.includes('|')
    ? content.split('|').map(s => s.trim())
    : [content, '']
  return `
    <div class="one-number">
      <div class="label">One Number</div>
      <div class="one-number-stat">${stat}</div>
      ${context ? `<div class="one-number-context">${context}</div>` : ''}
    </div>`
}

function shell(body: string, emailId: string, date: string, issueNumber?: number): string {
  const issue = issueNumber ? ` · #${issueNumber}` : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Longevity Digest</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="${BASE_URL}" class="wordmark">Longevity Digest</a>
      <div class="header-meta">${formattedDate(date)}${issue}</div>
    </div>
    ${body}
    ${trackingPixel(emailId)}
  </div>
</body>
</html>`
}

// ─── Full digest (paid) ───────────────────────────────────────────────────────

function buildFullDigestHtml(digest: DigestData, email: string): string {
  const lead      = digest.papers[0]
  const rest      = digest.papers.slice(1, 6)

  const sections = [
    lead ? leadHtml(lead, digest.leadAnalysis, digest.emailId) : '',
    digest.borisTake ? borisTakeHtml(digest.borisTake) : '',
    rest.length ? `<div class="label" style="margin-top:4px">The Rest</div>${rest.map(p => restItemHtml(p, digest.emailId)).join('')}` : '',
    digest.oneNumber ? oneNumberHtml(digest.oneNumber) : '',
    `<div class="footer">
      <p><a href="${BASE_URL}">longevitydigest.co</a> &middot; <a href="${manageUrl(email)}">Manage subscription</a></p>
    </div>`,
  ].filter(Boolean).join('\n')

  return shell(sections, digest.emailId, digest.date, digest.issueNumber)
}

// ─── Free tier (teaser) ───────────────────────────────────────────────────────

function buildFreeDigestHtml(digest: DigestData, email: string): string {
  const lead      = digest.papers[0]
  const freeRest  = digest.papers.slice(1, 3)
  const lockedRest= digest.papers.slice(3, 6)

  // Tease lead: first 2 sentences only
  const fullText = digest.leadAnalysis || (lead?.summary ?? '')
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [fullText]
  const teaser = sentences.slice(0, 2).join('').trim()

  const leadSection = lead ? `
    <div class="lead">
      <div class="label">Today's Lead</div>
      <div class="source">${lead.source.toUpperCase()}</div>
      <div class="lead-title">${lead.title}</div>
      <p class="lead-body">${teaser}</p>
      <p class="paywall"><strong>[Members only]</strong> Full analysis available to paid members. <a href="${BASE_URL}/subscribe">Upgrade — $12/month →</a></p>
      <div>${tags(lead.tags ?? lead.relevance)}</div>
    </div>` : ''

  const borisSection = `
    <div class="boris">
      <div class="label">Boris's Take</div>
      <p class="boris-text paywall">Available to members. <a href="${BASE_URL}/subscribe" style="color:${C.gold};font-weight:700">Upgrade to read →</a></p>
    </div>`

  const freeItems = freeRest.map(p => restItemHtml(p, digest.emailId)).join('')
  const lockedItems = lockedRest.map(p => `
    <div class="rest-item" style="opacity:0.5">
      <div class="rest-title">${p.title}</div>
      <p class="paywall"><strong>[Members only]</strong> <a href="${BASE_URL}/subscribe">Upgrade to read →</a></p>
    </div>`).join('')

  const restSection = (freeRest.length || lockedRest.length) ? `
    <div class="label" style="margin-top:4px">The Rest</div>
    ${freeItems}${lockedItems}` : ''

  const oneNum = digest.oneNumber ? oneNumberHtml(digest.oneNumber) : ''

  const ctaBlock = `
    <div class="cta">
      <h3>Get the full picture</h3>
      <p>Deep analysis, Boris's take, and every curated story — every morning.</p>
      <a href="${BASE_URL}/subscribe" class="cta-btn">Become a member — $12/month</a>
    </div>`

  const footer = `
    <div class="footer">
      <p><a href="${BASE_URL}">longevitydigest.co</a> &middot; <a href="${manageUrl(email)}">Manage subscription</a></p>
    </div>`

  const sections = [leadSection, borisSection, restSection, oneNum, ctaBlock, footer].filter(Boolean).join('\n')
  return shell(sections, digest.emailId, digest.date, digest.issueNumber)
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, tier: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY?.trim())
  const isFree = tier === 'free'

  const body = `
    <p style="font-size:20px;font-weight:700;color:${C.navy};margin-bottom:16px;font-family:Georgia,serif">You're in.</p>
    <p style="font-size:15px;color:${C.textBody};margin-bottom:32px;padding-bottom:28px;border-bottom:1px solid ${C.divider}">
      Starting tomorrow morning, you'll receive ${isFree
        ? 'the lead story and two curated items'
        : 'the full daily digest — deep analysis, Boris\'s editorial take, and every curated story'}.
      No jargon walls. No hype.
    </p>
    ${isFree ? `
    <div class="cta">
      <h3>Want the full picture?</h3>
      <p>Members get deep analysis, Boris's take, and all curated stories every morning.</p>
      <a href="${BASE_URL}/subscribe" class="cta-btn">Become a member — $99/year</a>
    </div>` : `
    <p style="font-size:15px;color:${C.textMuted}">You're a member. The full digest is yours, every morning.</p>`}
    <div class="footer">
      <p><a href="${BASE_URL}">longevitydigest.co</a> &middot; <a href="${manageUrl(email)}">Manage subscription</a></p>
    </div>`

  await resend.emails.send({
    from: 'Longevity Digest <hello@longevitydigest.co>',
    to: email,
    subject: "You're in — your first Longevity Digest arrives tomorrow",
    html: shell(body, 'welcome', new Date().toISOString().split('T')[0]),
  })
}

// ─── Daily digest send ────────────────────────────────────────────────────────

export async function sendDailyDigest(emails: string[], digest: DigestData, tier: 'free' | 'paid') {
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
