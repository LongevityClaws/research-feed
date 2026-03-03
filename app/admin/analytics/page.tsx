import {
  getSubscriberCount,
  getSubscribers,
  getDigestList,
  getDigestMeta,
  getOpenCount,
  getClickCount,
  getTopLinks,
  getGrowthData,
} from "../../../lib/kv"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const [totalSubs, freeSubs, paidSubs, digestIds, topLinks, growth] = await Promise.all([
    getSubscriberCount(),
    getSubscribers("free").then(s => s.length),
    getSubscribers("paid").then(s => s.length),
    getDigestList(),
    getTopLinks(10),
    getGrowthData(30),
  ])

  // Fetch stats for each digest
  const digestStats = await Promise.all(
    digestIds.slice(0, 50).map(async (id) => {
      const [meta, opens, clicks] = await Promise.all([
        getDigestMeta(id),
        getOpenCount(id),
        getClickCount(id),
      ])
      const recipientCount = parseInt(meta?.recipientCount ?? "0", 10)
      return {
        id,
        date: meta?.date ?? "—",
        subject: meta?.subject ?? "—",
        recipientCount,
        sentAt: meta?.sentAt ?? "—",
        opens,
        clicks,
        openRate: recipientCount > 0 ? ((opens / recipientCount) * 100).toFixed(1) : "—",
        clickRate: recipientCount > 0 ? ((clicks / recipientCount) * 100).toFixed(1) : "—",
      }
    })
  )

  return (
    <div style={{
      maxWidth: 960,
      margin: "0 auto",
      padding: "40px 24px",
      fontFamily: "-apple-system, 'Inter', sans-serif",
      color: "#1B2A4A",
      background: "#FAFAF7",
      minHeight: "100vh",
    }}>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 8,
        fontFamily: "Georgia, serif",
      }}>Longevity Digest — Analytics</h1>
      <p style={{ fontSize: 13, color: "#8B7355", marginBottom: 32, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>
        Private dashboard
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        <StatCard label="Total Subscribers" value={totalSubs} />
        <StatCard label="Free" value={freeSubs} />
        <StatCard label="Paid" value={paidSubs} />
        <StatCard label="Digests Sent" value={digestIds.length} />
      </div>

      {/* Subscriber growth (simple text chart) */}
      <Section title="Subscriber Growth (Last 30 Days)">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>New</th>
              <th style={thStyle}>Unsubs</th>
              <th style={thStyle}>Net</th>
            </tr>
          </thead>
          <tbody>
            {growth.filter(d => d.subscribes > 0 || d.unsubscribes > 0).map(d => (
              <tr key={d.date}>
                <td style={tdStyle}>{d.date}</td>
                <td style={tdStyle}>+{d.subscribes}</td>
                <td style={tdStyle}>{d.unsubscribes > 0 ? `-${d.unsubscribes}` : "0"}</td>
                <td style={{
                  ...tdStyle,
                  color: d.subscribes - d.unsubscribes >= 0 ? "#16a34a" : "#dc2626",
                  fontWeight: 600,
                }}>
                  {d.subscribes - d.unsubscribes >= 0 ? "+" : ""}{d.subscribes - d.unsubscribes}
                </td>
              </tr>
            ))}
            {growth.every(d => d.subscribes === 0 && d.unsubscribes === 0) && (
              <tr><td colSpan={4} style={{ ...tdStyle, color: "#94a3b8" }}>No growth events recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Digest stats */}
      <Section title="Digests Sent">
        {digestStats.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No digests sent yet. Stats will appear after the first send.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Subject</th>
                  <th style={thStyle}>Sent</th>
                  <th style={thStyle}>Opens</th>
                  <th style={thStyle}>Open %</th>
                  <th style={thStyle}>Clicks</th>
                  <th style={thStyle}>Click %</th>
                </tr>
              </thead>
              <tbody>
                {digestStats.map(d => (
                  <tr key={d.id}>
                    <td style={tdStyle}>{d.date}</td>
                    <td style={{ ...tdStyle, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.subject}</td>
                    <td style={tdStyle}>{d.recipientCount}</td>
                    <td style={tdStyle}>{d.opens}</td>
                    <td style={tdStyle}>{d.openRate}%</td>
                    <td style={tdStyle}>{d.clicks}</td>
                    <td style={tdStyle}>{d.clickRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Top links */}
      <Section title="Top Clicked Links">
        {topLinks.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No clicks tracked yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Link</th>
                <th style={thStyle}>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topLinks.map((link, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={link.url} style={{ color: "#8B7355", textDecoration: "none" }}>{link.url}</a>
                  </td>
                  <td style={tdStyle}>{link.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e2dc",
      borderRadius: 8,
      padding: "20px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1B2A4A", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#8B7355" }}>{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A", marginBottom: 16, fontFamily: "Georgia, serif" }}>{title}</h2>
      {children}
    </div>
  )
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #1B2A4A",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#8B7355",
}

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #e5e2dc",
  color: "#3a4a5c",
}
