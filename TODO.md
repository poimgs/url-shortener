# URL Shortener - TODO

## Security & Authentication

### 🔐 Replace x-user-id Header with Proper Authentication

**Priority: High**

The current authentication implementation uses a custom `x-user-id` header, which is not standard and has security implications.

**Current Implementation:**

- Web app sends `x-user-id` header with user ID from NextAuth session
- API trusts this header without cryptographic verification
- Located in: `apps/api/src/lib/trpc.ts:13` and `apps/web/src/components/providers.tsx:28`

**Security Issues:**

- No cryptographic verification of user identity
- API trusts any request with `x-user-id` header
- Vulnerable if API endpoints are exposed publicly

**Recommended Solutions:**

1. **JWT Token Authentication**
   - Send NextAuth JWT token in `Authorization: Bearer <token>` header
   - Verify JWT signature on API side
   - Extract user info from verified token

2. **Session Cookie Validation**
   - API validates NextAuth session cookies directly
   - Share session verification logic between web and API

3. **Shared Session Store**
   - Both apps access same session storage (Redis/database)
   - API validates session existence and user identity

**Files to Modify:**

- `apps/api/src/lib/trpc.ts` - Update context creation and protectedProcedure
- `apps/web/src/components/providers.tsx` - Update tRPC client headers
- Add JWT verification middleware or session validation logic

**Benefits:**

- Industry-standard authentication
- Cryptographic verification of user identity
- Better security for production deployment
- Compatible with external API access

## GitHub Workflows Setup

### 🚀 Prerequisites for GitHub Actions

**Priority: Medium**

The GitHub workflows are currently commented out and require setup before they can be activated.

**GitHub Secrets Required:**

- `AWS_ACCESS_KEY_ID` - AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for deployment
- `DB_PASSWORD` - Database password for Terraform
- `DATABASE_URL` - Database connection string for migrations
- `AMPLIFY_APP_ID` - AWS Amplify app ID for frontend deployment
- `SNYK_TOKEN` - Snyk token for security scanning (optional)

**GitHub Variables Required:**

- `AWS_REGION` - AWS region (optional, defaults to us-east-1)

**Infrastructure Prerequisites:**

- AWS ECR repositories for Docker images
- Terraform backend (S3 bucket + DynamoDB table for state)
- AWS Amplify app configured for frontend deployment
- PostgreSQL database accessible for migrations
- IAM roles/policies for GitHub Actions

**Activation Steps:**

1. Uncomment `.github/workflows/ci.yml` to enable CI on pull requests
2. Uncomment `.github/workflows/deploy.yml` to enable deployment on main/develop branches

**Files:**

- `.github/workflows/ci.yml` - CI pipeline (tests, lint, security scan)
- `.github/workflows/deploy.yml` - Deployment pipeline (build, push, deploy)

## Code Architecture & Refactoring

### 🏗️ Refactor tRPC Authentication Architecture

**Priority: Medium**

The current tRPC implementation handles too many concerns, making it complex and tightly coupled. Authentication logic should be separated from the tRPC framework.

**Current Issues:**

- tRPC context performing heavy operations (DB queries, user validation)
- Authentication tightly coupled to tRPC framework
- Mixed concerns in single context creation function
- `protectedProcedure` doing redundant work

**Current Implementation:**

```typescript
// apps/api/src/lib/trpc.ts:9-43
export async function createContext(opts?: CreateContextOptions) {
  // Does DB lookup and user validation
  const userId = req?.headers?.['x-user-id']
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return { session: { user }, user }
}
```

**Proposed Refactoring: Express Middleware Pattern**

1. **Create Authentication Middleware**
   - New file: `apps/api/src/middleware/auth.ts`
   - Extract user validation logic from tRPC context
   - Express middleware validates `x-user-id` and sets `req.user`
   - Handle auth errors at Express level before reaching tRPC

2. **Simplify tRPC Context**
   - Remove DB queries from `createContext`
   - Access `req.user` set by middleware
   - Lightweight context creation focused on request data

3. **Update Server Integration**
   - Add auth middleware to Express app before tRPC
   - Apply to both `/trpc` routes and direct `/:shortCode` endpoint

4. **Simplify Procedures**
   - `protectedProcedure` only checks `ctx.user` existence
   - Remove redundant context operations

**Benefits:**

- **Separation of concerns:** Auth logic separate from tRPC
- **Reusability:** Auth middleware works for non-tRPC routes
- **Performance:** Single auth check per request vs per procedure
- **Maintainability:** Clear auth flow, easier testing
- **Consistency:** Same auth logic for all endpoints

**Files to Modify:**

- `apps/api/src/middleware/auth.ts` (new)
- `apps/api/src/lib/trpc.ts` (simplify context and procedures)
- `apps/api/src/server.ts` (add middleware integration)

## URL Features

### ⏰ URL Expiry Implementation

**Priority: Medium**

The codebase has partial URL expiry functionality that needs completion or removal.

**Current State:**

- Database schema includes `expiresAt DateTime?` field (`packages/db/prisma/schema.prisma:59`)
- Expiry check exists in redirect logic (`apps/api/src/routes/url.ts:116-117`)
- TypeScript types include `expiresAt?: Date` (`packages/types/index.ts:11`)
- **Missing:** No way to set expiration when creating URLs (`apps/api/src/routes/url.ts:79-86`)

**Options:**

1. **Complete Implementation**
   - Add expiry duration field to URL creation form/API
   - Allow users to set custom expiration dates
   - Add default expiry options (24h, 7d, 30d, never)

2. **Remove Unused Functionality**
   - Remove `expiresAt` from schema, types, and redirect logic
   - Simplify codebase by removing unused expiry checks

**Recommendation:** Complete implementation for better URL management features.
