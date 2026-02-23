import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Longevity Digest — Daily Research for the Serious Biohacker',
  description: 'Curated daily summaries of the most important longevity research — partial reprogramming, gene therapy, senolytics, and more. For biotech investors, biohackers, and longevity enthusiasts.',
  openGraph: {
    title: 'Longevity Digest',
    description: 'Daily curated longevity research, plain English.',
    url: 'https://longevitydigest.co',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        background: '#0a0f1a',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: 1.6,
      }}>
        {children}
      </body>
    </html>
  )
}
