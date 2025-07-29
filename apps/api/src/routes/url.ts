import { TRPCError } from '@trpc/server'
import { prisma } from '@url-shortener/db'
import {
  createUrlSchema,
  getUrlSchema,
  getUserUrlsSchema,
} from '@url-shortener/types'
import { router, publicProcedure, protectedProcedure } from '../lib/trpc'
import { generateShortCode, isValidUrl, normalizeUrl } from '../lib/utils'

export const urlRouter = router({
  create: protectedProcedure
    .input(createUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const { originalUrl, customSlug } = input
      const userId = ctx.user.id

      const normalizedUrl = normalizeUrl(originalUrl)
      if (!isValidUrl(normalizedUrl)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid URL format',
        })
      }

      let shortCode = customSlug
      if (!shortCode) {
        shortCode = generateShortCode()

        // Ensure uniqueness
        let attempts = 0
        while (attempts < 5) {
          const existing = await prisma.url.findUnique({
            where: { shortCode },
          })
          if (!existing) break
          shortCode = generateShortCode()
          attempts++
        }

        if (attempts === 5) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate unique short code',
          })
        }
      } else {
        // Check if custom slug is available
        const existing = await prisma.url.findUnique({
          where: { shortCode: customSlug },
        })
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Custom slug already exists',
          })
        }
      }

      try {
        // Fetch page title
        const response = await fetch(normalizedUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'URL-Shortener-Bot/1.0' },
        })

        let title = normalizedUrl
        if (response.ok) {
          const fullResponse = await fetch(normalizedUrl, {
            headers: { 'User-Agent': 'URL-Shortener-Bot/1.0' },
          })
          const html = await fullResponse.text()
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          if (titleMatch) {
            title = titleMatch[1].trim()
          }
        }

        const url = await prisma.url.create({
          data: {
            shortCode,
            originalUrl: normalizedUrl,
            title,
            userId,
          },
        })

        return {
          id: url.id,
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          shortUrl: `${process.env.API_URL}/${url.shortCode}`,
          createdAt: url.createdAt,
          expiresAt: url.expiresAt,
        }
      } catch (error) {
        console.error('Error creating URL:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create short URL',
        })
      }
    }),

  redirect: publicProcedure.input(getUrlSchema).query(async ({ input }) => {
    const { shortCode } = input

    const url = await prisma.url.findUnique({
      where: { shortCode, isActive: true },
    })

    if (!url) {
      return { found: false, originalUrl: '' }
    }

    // Check if expired
    if (url.expiresAt && url.expiresAt < new Date()) {
      return { found: false, originalUrl: '' }
    }

    return {
      found: true,
      originalUrl: url.originalUrl,
    }
  }),

  getStats: publicProcedure.input(getUrlSchema).query(async ({ input }) => {
    const { shortCode } = input

    const url = await prisma.url.findUnique({
      where: { shortCode },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        title: true,
        createdAt: true,
        isActive: true,
      },
    })

    if (!url) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'URL not found',
      })
    }

    return url
  }),

  getUserUrls: protectedProcedure
    .input(getUserUrlsSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit } = input
      const skip = (page - 1) * limit
      const userId = ctx.user.id

      const [urls, total] = await Promise.all([
        prisma.url.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            shortCode: true,
            originalUrl: true,
            title: true,
            createdAt: true,
          },
        }),
        prisma.url.count({ where: { userId } }),
      ])

      return {
        urls,
        total,
        page,
        limit,
      }
    }),
})
