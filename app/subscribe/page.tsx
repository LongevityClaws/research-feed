'use client'
import { useState } from 'react'

export default function Subscribe() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Stripe not configured yet — check back soon.')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <a href="/" style={{ color: '#22c55e', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'block', marginBottom: '2rem' }}>← Back to Longevity Digest</a>
      <h1 style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Subscribe to Pro</h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Full daily digest · Full archive · All papers</p>

      {/* Plan toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
        {(['monthly', 'annual'] as const).map(p => (
          <button key={p} onClick={() => setPlan(p)} style={{
            background: plan === p ? '#22c55e' : '#111827',
            color: plan === p ? '#0a0f1a' : '#94a3b8',
            border: '1px solid',
            borderColor: plan === p ? '#22c55e' : '#1e293b',
            padding: '0.5rem 1.25rem',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}>
            {p === 'monthly' ? '$12 / month' : '$99 / year'}
            {p === 'annual' && <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>save 31%</span>}
          </button>
        ))}
      </div>

      <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{
          background: '#22c55e', color: '#0a0f1a', border: 'none',
          padding: '0.875rem', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
        }}>
          {loading ? 'Redirecting…' : `Subscribe ${plan === 'annual' ? '$99/yr' : '$12/mo'} →`}
        </button>
        {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
      </form>
      <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '1rem' }}>Secure checkout via Stripe. Cancel anytime.</p>
    </main>
  )
}
