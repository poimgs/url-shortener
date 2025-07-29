import { router } from '../lib/trpc'
import { urlRouter } from './url'

export const appRouter = router({
  url: urlRouter,
})

export type AppRouter = typeof appRouter
