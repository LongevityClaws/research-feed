'use client'
import { useState } from 'react'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier: 'free' }),
      })
      if (res.ok) setStatus('done')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') return (
    <div style={{ background: '#0f2d1a', border: '1px solid #166534', borderRadius: 8, padding: '1rem', color: '#4ade80', fontSize: '0.9rem' }}>
      ✅ You&apos;re in — check your inbox for today&apos;s highlight.
    </div>
  )

  return (
    <form onSubmit={handleSubmit} id="signup" style={{ display: 'flex', gap: '0.5rem', maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          flex: 1,
          minWidth: 220,
          padding: '0.75rem 1rem',
          borderRadius: 8,
          border: '1px solid #1e293b',
          background: '#111827',
          color: '#f1f5f9',
          fontSize: '0.9rem',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          background: '#22c55e',
          color: '#0a0f1a',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'loading' ? 'Subscribing…' : 'Get free digest'}
      </button>
      {status === 'error' && <p style={{ color: '#f87171', fontSize: '0.8rem', width: '100%', margin: 0 }}>Something went wrong. Try again.</p>}
    </form>
  )
}
