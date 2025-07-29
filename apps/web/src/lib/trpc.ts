import { createTRPCNext } from '@trpc/next'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../api/src/routes'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return process.env.API_URL || 'http://localhost:4000'
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
        }),
      ],
    }
  },
  ssr: false,
})