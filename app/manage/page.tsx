import { verifyManageToken } from '../../lib/manage-token'
import { isSubscribed, getSubscriberInfo } from '../../lib/kv'
import ManageClient from './client'

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; error?: string }>
}) {
  const params = await searchParams
  const email = params.email?.toLowerCase().trim()
  const token = params.token
  const error = params.error

  if (!email || !token || !verifyManageToken(email, token)) {
    return <ManageClient state="not-found" email="" error={error} />
  }

  const subscribed = await isSubscribed(email)
  if (!subscribed) {
    return <ManageClient state="not-found" email={email} error={error} />
  }

  const info = await getSubscriberInfo(email)
  const tier = (info?.tier as 'free' | 'paid') || 'free'
  const paused = info?.pausedUntil ? new Date(info.pausedUntil) > new Date() : false

  return (
    <ManageClient
      state={tier}
      email={email}
      token={token}
      paused={paused}
      pausedUntil={paused ? info?.pausedUntil : undefined}
      error={error}
    />
  )
}
