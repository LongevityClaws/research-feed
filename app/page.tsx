import digest from '../data/latest.json'
import EmailCapture from './components/EmailCapture'

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: '🔬 Partial Reprogramming',
  gene_therapy: '🧬 Gene Therapy',
  pet_longevity: '🐾 Pet Longevity',
  senolytics: '💊 Senolytics',
  epigenetic_clocks: '🕐 Epigenetic Clocks',
}

export default function Home() {
  const teaser = digest.papers.find(p => p.score >= 3) ?? digest.papers[0]
  const date = new Date(digest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1e293b', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#22c55e', letterSpacing: '-0.5px' }}>🧬 Longevity Digest</span>
        <a href="/subscribe" style={{ background: '#22c55e', color: '#0a0f1a', padding: '0.4rem 1rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
          Subscribe — $12/mo
        </a>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#0f2d1a', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid #166534' }}>
          Updated daily · {date}
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-1px', lineHeight: 1.15 }}>
          The most important longevity research,{' '}
          <span style={{ color: '#22c55e' }}>explained in plain English.</span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#94a3b8', maxWidth: 500, margin: '0 auto 2.5rem' }}>
          Daily curated summaries of papers on partial reprogramming, gene therapy, senolytics, and more — for biotech investors, biohackers, and longevity enthusiasts.
        </p>
        <EmailCapture />
        <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '1rem' }}>
          Free: 1 highlight/day. Paid ($12/mo or $99/yr): full digest + archive.
        </p>
      </section>

      {/* Today's free teaser */}
      <section style={{ maxWidth: 680, margin: '0 auto 4rem', padding: '0 2rem' }}>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '2rem', marginBottom: '1rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1rem' }}>
            Today&apos;s Free Highlight
          </p>
          <article style={{ background: '#111827', border: '1px solid #1e293b', borderLeft: '3px solid #22c55e', borderRadius: 8, padding: '1.25rem 1.5rem' }}>
            <a href={teaser.url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
              {teaser.title}
            </a>
            <p style={{ margin: '0 0 0.75rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {teaser.summary}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: '#0a0f1a', border: '1px solid #1e293b', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                {teaser.source}
              </span>
              {teaser.relevance.split('|').map(r => (
                <span key={r} style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                  {RELEVANCE_LABELS[r] ?? r}
                </span>
              ))}
            </div>
          </article>
        </div>

        {/* Blurred paid papers */}
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '2rem 0 1rem' }}>
          {digest.papers.length - 1} more in today&apos;s digest
        </p>
        <div style={{ position: 'relative' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '0.5rem', filter: 'blur(4px)', userSelect: 'none', opacity: 0.6 }}>
              <div style={{ height: 16, background: '#1e293b', borderRadius: 4, width: `${70 + i * 10}%`, marginBottom: 8 }} />
              <div style={{ height: 12, background: '#1e293b', borderRadius: 4, width: '90%', marginBottom: 4 }} />
              <div style={{ height: 12, background: '#1e293b', borderRadius: 4, width: '60%' }} />
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <a href="/subscribe" style={{ background: '#22c55e', color: '#0a0f1a', padding: '0.75rem 1.75rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}>
              Subscribe to unlock the full digest →
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 680, margin: '0 auto 5rem', padding: '0 2rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '2rem', letterSpacing: '-0.5px' }}>Simple pricing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '1.5rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Free</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem' }}>$0</p>
            <ul style={{ color: '#94a3b8', fontSize: '0.875rem', paddingLeft: '1.25rem', margin: '0 0 1.5rem' }}>
              <li>1 top paper per day</li>
              <li>Plain-English summary</li>
              <li>Email delivery</li>
            </ul>
            <a href="#signup" style={{ display: 'block', textAlign: 'center', border: '1px solid #22c55e', color: '#22c55e', padding: '0.6rem', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              Get free digest
            </a>
          </div>
          <div style={{ background: '#0f2d1a', border: '1px solid #166534', borderRadius: 12, padding: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, right: 16, background: '#22c55e', color: '#0a0f1a', padding: '2px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700 }}>BEST VALUE</div>
            <p style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Pro</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#22c55e' }}>$99<span style={{ fontSize: '1rem', color: '#64748b' }}>/yr</span></p>
            <p style={{ color: '#4ade80', fontSize: '0.75rem', margin: '0 0 1rem' }}>or $12/month</p>
            <ul style={{ color: '#94a3b8', fontSize: '0.875rem', paddingLeft: '1.25rem', margin: '0 0 1.5rem' }}>
              <li>Full daily digest (all papers)</li>
              <li>Relevance scoring</li>
              <li>Searchable archive</li>
              <li>Priority: partial reprogramming, gene therapy, senolytics</li>
            </ul>
            <a href="/subscribe" style={{ display: 'block', textAlign: 'center', background: '#22c55e', color: '#0a0f1a', padding: '0.6rem', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}>
              Subscribe now →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '2rem', textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>
        Longevity Digest · Built by 🧋 + 🦞 · <a href="mailto:hello@longevitydigest.co" style={{ color: '#475569' }}>hello@longevitydigest.co</a>
      </footer>
    </main>
  )
}
