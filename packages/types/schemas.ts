import { z } from 'zod'

// URL Shortener Schemas
export const createUrlSchema = z.object({
  originalUrl: z
    .string()
    .min(1, 'URL is required')
    .url('Please enter a valid URL'),
  customSlug: z.string().optional(),
})

export const getUrlSchema = z.object({
  shortCode: z.string().min(1, 'Short code is required'),
})

export const getUserUrlsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

// Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signinSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

// Type exports using z.infer
export type CreateUrlRequest = z.infer<typeof createUrlSchema>
export type GetUrlRequest = z.infer<typeof getUrlSchema>
export type GetUserUrlsRequest = z.infer<typeof getUserUrlsSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type SigninRequest = z.infer<typeof signinSchema>
