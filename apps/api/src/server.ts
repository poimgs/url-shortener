import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './routes'

const app = express()
const PORT = process.env.PORT || 4000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
)

// Redirect endpoint for short URLs
app.get('/:shortCode', async (req, res) => {
  try {
    const caller = appRouter.createCaller({})
    const result = await caller.url.redirect({
      shortCode: req.params.shortCode,
    })

    if (result.found) {
      res.redirect(301, result.originalUrl)
    } else {
      res.status(404).json({ error: 'URL not found' })
    }
  } catch (error) {
    console.error('Redirect error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`)
})
