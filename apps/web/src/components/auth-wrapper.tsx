'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">URL Shortener</h1>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => signIn()}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}