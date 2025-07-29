import './globals.css'
import { Inter } from 'next/font/google'
import { trpc } from '@/lib/trpc'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'URL Shortener',
  description: 'A simple and fast URL shortener',
}

function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

export default trpc.withTRPC(RootLayout)