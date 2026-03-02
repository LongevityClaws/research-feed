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
    <div className="email-success">
      You&apos;re in. Check your inbox for today&apos;s highlight.
    </div>
  )

  return (
    <form onSubmit={handleSubmit} id="signup" className="email-form">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="email-input"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="email-submit"
      >
        {status === 'loading' ? 'Subscribing\u2026' : 'Start reading'}
      </button>
      {status === 'error' && <p className="email-error">Something went wrong. Try again.</p>}
    </form>
  )
}
