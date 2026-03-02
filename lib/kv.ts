async function getKV() {
  if (!process.env.KV_REST_API_URL?.trim() || !process.env.KV_REST_API_TOKEN?.trim()) return null
  const { kv } = await import("@vercel/kv")
  return kv
}
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
