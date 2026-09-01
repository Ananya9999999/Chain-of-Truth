import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider, themeInitScript } from '@/lib/theme'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Chain of Truth — Evidence Integrity System',
  description:
    'AI-assisted evidence integrity and investigation platform for police and judiciary. AI assists. Humans decide.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1a1d24',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning is required and correct here: the theme script
    // below deliberately mutates <html>'s className before React hydrates, so
    // the server markup and the client DOM differ by design. Suppressing it on
    // this one element is the documented approach; without it React logs a
    // hydration mismatch on every load. It does not suppress warnings for any
    // descendant.
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Runs before first paint so a light-theme user never sees a dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
