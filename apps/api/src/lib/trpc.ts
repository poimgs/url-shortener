import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import { prisma } from '@url-shortener/db'

interface CreateContextOptions {
  req?: any
}

export async function createContext(opts?: CreateContextOptions) {
  const req = opts?.req

  // Extract user ID from headers sent by the web app
  const userId = req?.headers?.['x-user-id']

  if (userId) {
    try {
      // Validate that the user exists in the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      })

      if (user) {
        return {
          session: { user },
          user,
        }
      }
    } catch (error) {
      console.error('Error validating user:', error)
    }
  }

  return {
    session: null,
    user: null,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async opts => {
  const { ctx } = opts

  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  })
})
