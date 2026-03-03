import { createHmac, createHash } from 'crypto'

function getSecret(): string {
  return process.env.MANAGE_SECRET?.trim() || 'fallback-not-configured'
}

export function generateManageToken(email: string): string {
  const secret = getSecret()
  return createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('hex')
}

export function verifyManageToken(email: string, token: string): boolean {
  const expected = generateManageToken(email)
  // Constant-time comparison
  if (expected.length !== token.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return mismatch === 0
}

export function manageUrl(email: string): string {
  const token = generateManageToken(email)
  return `https://longevitydigest.co/manage?email=${encodeURIComponent(email)}&token=${token}`
}
