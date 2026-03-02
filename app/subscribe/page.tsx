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
      else setError(data.error || 'Stripe not configured yet \u2014 check back soon.')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="subscribe-page">
      <a href="/" className="subscribe-back">&larr; Back to Longevity Digest</a>
      <h1 className="subscribe-title">Join the full briefing</h1>
      <p className="subscribe-sub">Every paper, every day. Full archive access.</p>

      <div className="plan-toggle">
        {(['monthly', 'annual'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`plan-btn ${plan === p ? 'plan-btn-active' : ''}`}
          >
            {p === 'monthly' ? '$12 / month' : '$99 / year'}
            {p === 'annual' && <span className="plan-save">save 31%</span>}
          </button>
        ))}
      </div>

      <form onSubmit={handleCheckout} className="subscribe-form">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Redirecting\u2026' : `Subscribe ${plan === 'annual' ? '$99/yr' : '$12/mo'} \u2192`}
        </button>
        {error && <p className="subscribe-error">{error}</p>}
      </form>
      <p className="subscribe-secure">Secure checkout via Stripe. Cancel anytime.</p>
    </main>
  )
}
