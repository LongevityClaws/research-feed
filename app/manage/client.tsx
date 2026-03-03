'use client'
import { useState } from 'react'

type Props = {
  state: 'free' | 'paid' | 'not-found'
  email: string
  token?: string
  paused?: boolean
  pausedUntil?: string
  error?: string
}

export default function ManageClient({ state, email, token, paused, pausedUntil, error }: Props) {
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState(error || '')
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [isPaused, setIsPaused] = useState(paused || false)

  async function handleAction(action: string) {
    setLoading(action)
    setMessage('')
    try {
      const res = await fetch('/api/manage-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.')
        return
      }
      if (action === 'unsubscribe') {
        setUnsubscribed(true)
        setMessage('You have been unsubscribed.')
      } else if (action === 'pause') {
        setIsPaused(true)
        setMessage('Emails paused for 2 weeks.')
      } else if (action === 'portal' && data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      setMessage('Something went wrong.')
    } finally {
      setLoading('')
    }
  }

  if (unsubscribed) {
    return (
      <Layout>
        <h1 style={styles.heading}>Unsubscribed</h1>
        <p style={styles.sub}>You have been removed from Longevity Digest.</p>
        <a href="https://longevitydigest.co" style={styles.link}>Back to longevitydigest.co</a>
      </Layout>
    )
  }

  if (state === 'not-found') {
    return (
      <Layout>
        <h1 style={styles.heading}>Email not found</h1>
        <p style={styles.sub}>
          We couldn&apos;t find a subscription for this email.
          {error && <><br /><span style={{ color: '#c0392b' }}>{error}</span></>}
        </p>
        <a href="https://longevitydigest.co" style={styles.link}>Go to longevitydigest.co</a>
      </Layout>
    )
  }

  if (state === 'free') {
    return (
      <Layout>
        <h1 style={styles.heading}>Manage subscription</h1>
        <p style={styles.sub}>You&apos;re subscribed to the free tier.</p>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          <button
            onClick={() => handleAction('checkout')}
            disabled={loading !== ''}
            style={styles.btnPrimary}
          >
            {loading === 'checkout' ? 'Redirecting\u2026' : 'Upgrade to paid \u2014 $12/month'}
          </button>
          <button
            onClick={() => handleAction('unsubscribe')}
            disabled={loading !== ''}
            style={styles.btnSecondary}
          >
            {loading === 'unsubscribe' ? 'Processing\u2026' : 'Unsubscribe'}
          </button>
        </div>
      </Layout>
    )
  }

  // paid
  return (
    <Layout>
      <h1 style={styles.heading}>Manage subscription</h1>
      <p style={styles.sub}>You&apos;re a paid member. Thank you.</p>
      {isPaused && pausedUntil && (
        <p style={{ ...styles.sub, color: '#8B7355', fontStyle: 'italic' }}>
          Emails paused until {new Date(pausedUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
        </p>
      )}
      {message && <p style={styles.message}>{message}</p>}
      <div style={styles.actions}>
        <button
          onClick={() => handleAction('portal')}
          disabled={loading !== ''}
          style={styles.btnPrimary}
        >
          {loading === 'portal' ? 'Redirecting\u2026' : 'Manage billing'}
        </button>
        {!isPaused && (
          <button
            onClick={() => handleAction('pause')}
            disabled={loading !== ''}
            style={styles.btnSecondary}
          >
            {loading === 'pause' ? 'Processing\u2026' : 'Pause emails for 2 weeks'}
          </button>
        )}
      </div>
    </Layout>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        <a href="https://longevitydigest.co" style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#1B2A4A',
          letterSpacing: -0.5,
          textDecoration: 'none',
          fontFamily: "Georgia, serif",
        }}>Longevity Digest</a>
        <div style={{ marginTop: 32 }}>
          {children}
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1B2A4A',
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  message: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 16,
    fontFamily: "-apple-system, sans-serif",
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  btnPrimary: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    background: '#1B2A4A',
    color: '#FAFAF7',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "-apple-system, sans-serif",
  },
  btnSecondary: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    background: 'transparent',
    color: '#8B7355',
    border: '1px solid #e5e2dc',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "-apple-system, sans-serif",
  },
  link: {
    color: '#8B7355',
    fontSize: 14,
    fontFamily: "-apple-system, sans-serif",
  },
}
