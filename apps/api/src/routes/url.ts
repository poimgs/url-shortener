import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { prisma } from '@url-shortener/db'
import { router, publicProcedure } from '../lib/trpc'
import { generateShortCode, isValidUrl, normalizeUrl } from '../lib/utils'

const createUrlSchema = z.object({
  originalUrl: z.string().min(1, 'URL is required'),
  customSlug: z.string().optional(),
})

const getUrlSchema = z.object({
  shortCode: z.string().min(1, 'Short code is required'),
})

const getUserUrlsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

export const urlRouter = router({
  create: publicProcedure.input(createUrlSchema).mutation(async ({ input }) => {
    const { originalUrl, customSlug } = input

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
        },
      })

      return {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        shortUrl: `${process.env.API_URL || 'http://localhost:4000'}/${url.shortCode}`,
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

    // Update click count and last accessed
    await prisma.url.update({
      where: { id: url.id },
      data: {
        clickCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    })

    // TODO: Log click analytics

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
        clickCount: true,
        createdAt: true,
        lastAccessedAt: true,
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

  getUserUrls: publicProcedure
    .input(getUserUrlsSchema)
    .query(async ({ input }) => {
      const { page, limit } = input
      const skip = (page - 1) * limit

      // TODO: Add user authentication and filter by userId
      const [urls, total] = await Promise.all([
        prisma.url.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            shortCode: true,
            originalUrl: true,
            title: true,
            clickCount: true,
            createdAt: true,
            lastAccessedAt: true,
          },
        }),
        prisma.url.count(),
      ])

      return {
        urls,
        total,
        page,
        limit,
      }
    }),
})
