import digest from '../data/latest.json'

const RELEVANCE_LABELS: Record<string, string> = {
  partial_reprogramming: '🔬 Partial Reprogramming',
  gene_therapy: '🧬 Gene Therapy',
  pet_longevity: '🐾 Pet Longevity',
  senolytics: '💊 Senolytics',
  epigenetic_clocks: '🕐 Epigenetic Clocks',
}

const SCORE_COLORS = ['', '#6b7280', '#94a3b8', '#22c55e', '#16a34a', '#15803d']

export default function Home() {
  const highlighted = digest.papers.filter(p => p.score >= 3)
  const rest = digest.papers.filter(p => p.score < 3)

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#22c55e', fontSize: '1.5rem' }}>🧬 Longevity Research Feed</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Updated {digest.date} · {digest.papers.length} papers · {highlighted.length} highlighted
        </p>
      </header>

      {highlighted.length > 0 && (
        <section>
          <h2 style={{ color: '#22c55e', fontSize: '1rem', marginBottom: '1rem' }}>⭐ Highlighted (Score 3+)</h2>
          {highlighted.map((paper, i) => (
            <article key={i} style={{
              background: '#1e293b', borderRadius: 8, padding: '1rem 1.25rem',
              marginBottom: '0.75rem', borderLeft: `3px solid ${SCORE_COLORS[paper.score] || '#22c55e'}`
            }}>
              <a href={paper.url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
                {paper.title}
              </a>
              <p style={{ margin: '0.5rem 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {paper.summary}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: '#0f172a', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#64748b' }}>
                  {paper.source.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.75rem', color: SCORE_COLORS[paper.score] || '#22c55e' }}>
                  {'★'.repeat(paper.score)}{'☆'.repeat(5 - paper.score)}
                </span>
                {paper.relevance.split('|').map(r => (
                  <span key={r} style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {RELEVANCE_LABELS[r] || r}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1rem' }}>All Papers</h2>
          {rest.map((paper, i) => (
            <article key={i} style={{
              background: '#1e293b', borderRadius: 8, padding: '0.75rem 1rem',
              marginBottom: '0.5rem', opacity: 0.7
            }}>
              <a href={paper.url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>
                {paper.title}
              </a>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>{paper.summary}</p>
            </article>
          ))}
        </section>
      )}

      <footer style={{ marginTop: '3rem', color: '#334155', fontSize: '0.75rem', textAlign: 'center' }}>
        Aggregated by Gamba · Deployed by Boba · LongevityClaws 🧋🦞
      </footer>
    </main>
  )
}
