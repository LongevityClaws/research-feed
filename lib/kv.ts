async function getKV() {
  if (!process.env.KV_REST_API_URL?.trim() || !process.env.KV_REST_API_TOKEN?.trim()) return null
  const { kv } = await import("@vercel/kv")
  return kv
}

export type DigestRecipientResult = {
  recipient: string
  tier: "free" | "paid"
  accepted: boolean
  providerMessageId?: string | null
  error?: string | null
}

// ── Subscriber management ────────────────────────────────────────────────

export async function addSubscriber(email: string, tier: "free" | "paid") {
  const db = await getKV()
  if (!db) { console.log(`[kv] not configured — not persisting ${email}`); return }
  await db.sadd(`subscribers:${tier}`, email)
  await db.sadd("subscribers:all", email)
  await db.hset(`subscriber:${email}`, { tier, subscribedAt: new Date().toISOString() })
}
export async function removeSubscriber(email: string) {
  const db = await getKV()
  if (!db) return
  await db.srem("subscribers:free", email)
  await db.srem("subscribers:paid", email)
  await db.srem("subscribers:all", email)
  await db.del(`subscriber:${email}`)
}
export async function upgradeSubscriber(email: string) {
  const db = await getKV()
  if (!db) return
  await db.srem("subscribers:free", email)
  await db.sadd("subscribers:paid", email)
  await db.hset(`subscriber:${email}`, { tier: "paid", upgradedAt: new Date().toISOString() })
}
export async function getSubscribers(tier: "free" | "paid" | "all" = "all"): Promise<string[]> {
  const db = await getKV()
  if (!db) return []
  return (await db.smembers(`subscribers:${tier}`)) as string[]
}
export async function isSubscribed(email: string): Promise<boolean> {
  const db = await getKV()
  if (!db) return false
  return (await db.sismember("subscribers:all", email)) === 1
}
export async function getSubscriberCount(): Promise<number> {
  const db = await getKV()
  if (!db) return 0
  return (await db.scard("subscribers:all")) ?? 0
}
export async function getSubscriberInfo(email: string): Promise<Record<string, string> | null> {
  const db = await getKV()
  if (!db) return null
  return await db.hgetall(`subscriber:${email}`)
}
export async function setStripeCustomerId(email: string, customerId: string) {
  const db = await getKV()
  if (!db) return
  await db.hset(`subscriber:${email}`, { stripeCustomerId: customerId })
}
export async function pauseSubscriber(email: string, days: number) {
  const db = await getKV()
  if (!db) return
  const until = new Date()
  until.setDate(until.getDate() + days)
  await db.hset(`subscriber:${email}`, { pausedUntil: until.toISOString() })
}
export async function isSubscriberPaused(email: string): Promise<boolean> {
  const info = await getSubscriberInfo(email)
  if (!info?.pausedUntil) return false
  return new Date(info.pausedUntil) > new Date()
}

// ── Email send tracking ──────────────────────────────────────────────────

export async function trackEmailSend(emailId: string, data: {
  date: string
  subject: string
  recipientCount: number
  sentAt: string
  issueNumber?: number
  acceptedCount?: number
  providerMessageIds?: string[]
  recipientResults?: DigestRecipientResult[]
}) {
  const db = await getKV()
  if (!db) return
  const providerMessageIds = data.providerMessageIds ?? []
  const recipientResults = data.recipientResults ?? []

  await db.hset(`email:${emailId}`, {
    date: data.date,
    subject: data.subject,
    recipientCount: data.recipientCount,
    sentAt: data.sentAt,
    issueNumber: data.issueNumber ?? "",
    acceptedCount: data.acceptedCount ?? providerMessageIds.length,
    providerMessageIdsJson: JSON.stringify(providerMessageIds),
    recipientResultsJson: JSON.stringify(recipientResults),
  })
  // Add to ordered list of sent digests
  await db.lpush("digests:sent", emailId)
  // Date index for watchdog: digest:sent:YYYY-MM-DD = emailId
  await db.set(`digest:sent:${data.date}`, emailId)
  await db.hset(`digest:meta:${data.date}`, {
    emailId,
    date: data.date,
    subject: data.subject,
    recipientCount: data.recipientCount,
    sentAt: data.sentAt,
    issueNumber: data.issueNumber ?? "",
    acceptedCount: data.acceptedCount ?? providerMessageIds.length,
    providerMessageIdsJson: JSON.stringify(providerMessageIds),
    recipientResultsJson: JSON.stringify(recipientResults),
  })

  for (const result of recipientResults) {
    if (!result.providerMessageId) continue
    await db.hset(`provider-email:${result.providerMessageId}`, {
      internalEmailId: emailId,
      date: data.date,
      recipient: result.recipient,
      tier: result.tier,
      accepted: result.accepted ? "true" : "false",
      status: result.accepted ? "accepted" : "failed",
      error: result.error ?? "",
      createdAt: data.sentAt,
      updatedAt: data.sentAt,
    })
  }
}

export async function getDigestMetaByDate(date: string): Promise<Record<string, string> | null> {
  const db = await getKV()
  if (!db) return null
  return await db.hgetall(`digest:meta:${date}`)
}

export async function markProviderEmailEvent(providerMessageId: string, eventType: string, payload: Record<string, unknown> = {}) {
  const db = await getKV()
  if (!db) return
  const now = new Date().toISOString()
  const existing = await db.hgetall(`provider-email:${providerMessageId}`) as Record<string, string> | null
  const patch: Record<string, string> = {
    lastEvent: eventType,
    updatedAt: now,
    lastEventPayloadJson: JSON.stringify(payload),
  }

  const lower = eventType.toLowerCase()
  if (lower.includes("deliver")) patch.deliveredAt = now
  if (lower.includes("bounce")) patch.bouncedAt = now
  if (lower.includes("complain")) patch.complainedAt = now
  if (lower.includes("open")) patch.openedAt = now
  if (lower.includes("click")) patch.clickedAt = now
  if (lower.includes("defer")) patch.deferredAt = now
  patch.status = lower

  await db.hset(`provider-email:${providerMessageId}`, patch)

  const date = existing?.date
  if (!date) return
  const digestMeta = await db.hgetall(`digest:meta:${date}`) as Record<string, string> | null
  if (!digestMeta) return

  const statuses: Record<string, string> = JSON.parse(digestMeta.providerStatusesJson ?? '{}') as Record<string, string>
  statuses[providerMessageId] = lower
  await db.hset(`digest:meta:${date}`, {
    providerStatusesJson: JSON.stringify(statuses),
    lastProviderEventAt: now,
  })
}

// ── Open tracking ────────────────────────────────────────────────────────

export async function trackOpen(emailId: string) {
  const db = await getKV()
  if (!db) return
  const ts = Date.now().toString()
  await db.sadd(`opens:${emailId}`, ts)
  await db.incr(`opens:count:${emailId}`)
}

export async function getOpenCount(emailId: string): Promise<number> {
  const db = await getKV()
  if (!db) return 0
  return (await db.get(`opens:count:${emailId}`)) as number ?? 0
}

// ── Click tracking ───────────────────────────────────────────────────────

export async function trackClick(emailId: string, url: string) {
  const db = await getKV()
  if (!db) return
  await db.incr(`clicks:count:${emailId}`)
  // Track per-URL clicks
  await db.hincrby(`clicks:urls:${emailId}`, url, 1)
  // Global top links
  await db.zincrby("clicks:top", 1, url)
}

export async function getClickCount(emailId: string): Promise<number> {
  const db = await getKV()
  if (!db) return 0
  return (await db.get(`clicks:count:${emailId}`)) as number ?? 0
}

export async function getTopLinks(limit: number = 10): Promise<{ url: string; clicks: number }[]> {
  const db = await getKV()
  if (!db) return []
  const results = await db.zrange("clicks:top", 0, limit - 1, { rev: true, withScores: true })
  const links: { url: string; clicks: number }[] = []
  for (let i = 0; i < results.length; i += 2) {
    links.push({ url: results[i] as string, clicks: results[i + 1] as number })
  }
  return links
}

// ── Digest metadata ──────────────────────────────────────────────────────

export async function getDigestList(): Promise<string[]> {
  const db = await getKV()
  if (!db) return []
  return (await db.lrange("digests:sent", 0, -1)) as string[]
}

export async function getDigestMeta(emailId: string): Promise<Record<string, string> | null> {
  const db = await getKV()
  if (!db) return null
  return await db.hgetall(`email:${emailId}`)
}

// ── Subscriber growth ────────────────────────────────────────────────────

export async function recordSubscriberEvent(type: "subscribe" | "unsubscribe") {
  const db = await getKV()
  if (!db) return
  const day = new Date().toISOString().slice(0, 10)
  await db.hincrby(`growth:${day}`, type, 1)
}

export async function getGrowthData(days: number = 30): Promise<{ date: string; subscribes: number; unsubscribes: number }[]> {
  const db = await getKV()
  if (!db) return []
  const results: { date: string; subscribes: number; unsubscribes: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const day = d.toISOString().slice(0, 10)
    const data = await db.hgetall(`growth:${day}`) as Record<string, number> | null
    results.push({
      date: day,
      subscribes: data?.subscribe ?? 0,
      unsubscribes: data?.unsubscribe ?? 0,
    })
  }
  return results.reverse()
}

// ── Issue counter ────────────────────────────────────────────────────────

export async function getNextIssueNumber(): Promise<number> {
  const db = await getKV()
  if (!db) return 1
  return (await db.incr("digest:issue_number")) as number
}
