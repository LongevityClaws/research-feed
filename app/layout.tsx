import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Longevity Research Feed',
  description: 'Daily digest of papers on partial reprogramming, gene therapy, senolytics, and pet longevity',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
