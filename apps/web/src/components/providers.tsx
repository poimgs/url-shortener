'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState, useMemo } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { AuthWrapper } from '@/components/auth-wrapper'

function getBaseUrl() {
  return process.env.API_URL
}

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [queryClient] = useState(() => new QueryClient())

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: `${getBaseUrl()}/trpc`,
            headers: () => {
              // Send user ID from session
              if (session?.user?.id) {
                return {
                  'x-user-id': session.user.id,
                }
              }
              return {}
            },
          }),
        ],
      }),
    [session?.user?.id]
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </TRPCProvider>
    </SessionProvider>
  )
}
