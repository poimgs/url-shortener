# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npm run db:generate --workspace=packages/db

# Build API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/node_modules/.prisma ./.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "server.js"]