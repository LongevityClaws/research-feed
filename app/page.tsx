import digest from '../data/latest.json'
import EmailCapture from './components/EmailCapture'

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: 'Reprogramming',
  gene_therapy: 'Gene Therapy',
  pet_longevity: 'Pet Longevity',
  senolytics: 'Senolytics',
  epigenetic_clocks: 'Epigenetic Clocks',
}

export default function Home() {
  const teaser = digest.papers.find(p => p.score >= 3) ?? digest.papers[0]
  const date = new Date(digest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main>
      {/* ── Nav ── */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <img src="/ld-mark.png" alt="" aria-hidden="true" />
          <span className="nav-wordmark">Longevity Digest</span>
        </a>
        <a href="/subscribe" className="nav-cta">
          Subscribe
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-date">
          {date}
        </div>
        <h1>
          Longevity research worth your time,{' '}
          <em>in language you can actually use.</em>
        </h1>
        <p className="hero-sub">
          Each morning we read the new papers on reprogramming, senolytics,
          gene therapy, and epigenetic clocks. Then we write you a short,
          honest briefing — no jargon walls, no hype.
        </p>
        <EmailCapture />
        <p className="hero-note">
          The daily highlight is free. The full digest is $12/mo or $99/yr.
        </p>
      </section>

      {/* ── Today's highlight ── */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '0 auto 3rem', padding: '0 2rem' }} className="content-section">
        <hr className="section-divider" style={{ marginTop: 0, marginBottom: '3rem' }} />
        <p className="section-label">Today&apos;s highlight</p>
        <article className="paper-card">
          <a href={teaser.url} target="_blank" rel="noopener noreferrer" className="paper-card-title">
            {teaser.title}
          </a>
          <p className="paper-card-summary">
            {teaser.summary}
          </p>
          <div className="paper-card-meta">
            <span className="tag">{teaser.source}</span>
            {(Array.isArray((teaser as any).tags)
              ? (teaser as any).tags
              : ((teaser as any).relevance ?? '').split('|').map((r: string) => r.trim()).filter(Boolean)
            ).map((r: string) => (
              <span key={r} className="tag tag-accent">
                {RELEVANCE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        </article>
      </section>

      {/* ── Locked papers ── */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '0 auto 4rem', padding: '0 2rem' }} className="content-section">
        <p className="section-label">{digest.papers.length - 1} more in today&apos;s digest</p>
        <div className="locked-papers">
          {[1, 2, 3].map(i => (
            <div key={i} className="locked-placeholder">
              <div className="locked-placeholder-line locked-placeholder-line-title" style={{ width: `${65 + i * 10}%` }} />
              <div className="locked-placeholder-line locked-placeholder-line-text" style={{ width: '92%' }} />
              <div className="locked-placeholder-line locked-placeholder-line-text" style={{ width: '58%' }} />
            </div>
          ))}
          <div className="locked-overlay">
            <a href="/subscribe" className="btn-primary">
              Read the full digest &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '0 auto 5rem', padding: '0 2rem' }} className="content-section">
        <hr className="section-divider" />
        <h2 className="font-display" style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 400, color: 'var(--ink)', marginBottom: '0.5rem' }}>
          Two ways to read
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '2.5rem' }}>
          Start free, upgrade when you want the whole picture.
        </p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <p className="pricing-tier">Reader</p>
            <p className="pricing-price">$0</p>
            <p className="pricing-alt">&nbsp;</p>
            <ul className="pricing-features">
              <li>One top paper each day</li>
              <li>Plain-English summary</li>
              <li>Delivered by email</li>
            </ul>
            <a href="#signup" className="btn-outline">
              Start reading free
            </a>
          </div>
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Best value</div>
            <p className="pricing-tier">Member</p>
            <p className="pricing-price">$99<span>/yr</span></p>
            <p className="pricing-alt">or $12/month</p>
            <ul className="pricing-features">
              <li>Every paper, every morning</li>
              <li>Relevance scoring per paper</li>
              <li>Searchable archive</li>
              <li>Focus areas: reprogramming, gene therapy, senolytics</li>
            </ul>
            <a href="/subscribe" className="btn-solid">
              Become a member &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <p className="footer-brand">Longevity Digest</p>
        <p className="footer-links">
          <a href="mailto:hello@longevitydigest.co">hello@longevitydigest.co</a>
        </p>
      </footer>
    </main>
  )
}
