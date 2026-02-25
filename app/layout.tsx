import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Client Dashboard — Advisory Portal',
  description: 'CPA & Financial Advisory Client Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
