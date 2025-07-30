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

## Code Organization & Architecture

### 📁 Component Directory Structure

**Priority: Low**

The current component organization could be improved to better separate concerns and follow architectural best practices.

**Current Structure:**
- `apps/web/src/components/` - Contains both UI components and providers/wrappers
- Mixed concerns: UI components alongside context providers and authentication logic

**Architectural Considerations:**

1. **Separation of Concerns**
   - Components should ideally be UI-only (rendering visual elements)
   - Providers/contexts handle state management and data flow
   - Authentication logic separate from UI rendering

2. **Current Mixed Concerns:**
   - `providers.tsx` - Contains provider logic (appropriate for components/ or separate providers/)
   - `auth-wrapper.tsx` - **Violates Single Responsibility Principle:** 
     - Handles authentication state/logic AND renders navbar UI
     - Should be split into separate auth provider + navbar component
   - `ui/` folder - Pure UI components (follows good practices)

**Improvement Options:**

1. **Strict Separation:**
   ```
   src/
   ├── components/        # UI-only components
   │   ├── ui/           # Reusable UI primitives
   │   ├── navbar.tsx    # Pure UI navbar component
   │   └── layout.tsx    # Layout wrapper component
   ├── providers/        # Context providers and state management
   │   ├── auth-provider.tsx
   │   └── trpc-provider.tsx
   └── lib/              # Utilities and configurations
   ```

2. **Hybrid Approach:**
   ```
   src/
   ├── components/       # UI components + layout wrappers
   │   ├── ui/          # Pure UI components
   │   ├── layout/      # Layout and wrapper components
   │   └── forms/       # Form components
   ├── providers/       # Pure context providers
   └── lib/             # Utilities
   ```

**Benefits of Refactoring:**
- Clear separation between UI and logic
- Better testability (UI components can be tested independently)
- Improved maintainability as project grows
- Follows React architectural best practices

**Files to Consider:**
- `apps/web/src/components/providers.tsx` - Could move to `src/providers/`
- `apps/web/src/components/auth-wrapper.tsx` - **Critical refactor needed:**
  - Split authentication logic into separate auth provider
  - Extract navbar/header UI into dedicated component (`navbar.tsx`)
  - Create layout wrapper that composes auth state + navbar UI
- Create new directory structure as project scales

**Specific Auth-Wrapper Issues:**
- Currently handles both session management AND navbar rendering
- Mixes authentication concerns with UI layout responsibilities  
- Makes testing difficult (can't test navbar UI independently of auth logic)
- Violates separation of concerns principle

**Note:** Current flat structure works fine for small projects, but consider refactoring as the component count grows.

## Database & Development Setup

### 🌱 Configure Prisma Seed Script for Local Development

**Priority: Medium**

The Prisma seed script exists (`packages/db/prisma/seed.ts`) but is not configured to run automatically during development setup.

**Current State:**
- Seed script creates test user and sample URLs
- No `"prisma"` configuration in `packages/db/package.json`  
- Must be run manually with `npx prisma db seed`

**Benefits of Proper Configuration:**
- Consistent test data for local development
- Easier onboarding for new developers
- Automated database population after migrations
- Better development experience

**Implementation Steps:**
1. Add `"prisma"` section to `packages/db/package.json`:
   ```json
   {
     "prisma": {
       "seed": "tsx prisma/seed.ts"
     }
   }
   ```
2. Update seed script with more comprehensive test data
3. Document seeding process in development setup
4. Consider integrating with Docker setup for automated seeding

**Files to Modify:**
- `packages/db/package.json` - Add prisma seed configuration
- `packages/db/prisma/seed.ts` - Enhance with more test data (optional)
- Development documentation - Add seeding instructions

## Testing & Quality Assurance

### 🧪 Add Comprehensive Test Cases

**Priority: High**

The application currently lacks a comprehensive test suite, which is critical for maintaining code quality and preventing regressions as the codebase grows.

**Current State:**
- No existing test files found in the repository
- `npm run test` script exists but may not be properly configured
- No testing framework setup (Jest, Vitest, etc.)

**Required Test Coverage:**

1. **API/Backend Tests (`apps/api/`)**
   - Unit tests for tRPC procedures (`src/routes/url.ts`)
   - Integration tests for database operations
   - Authentication/authorization tests
   - URL shortening and redirect functionality tests
   - Error handling and validation tests

2. **Frontend Tests (`apps/web/`)**
   - Component unit tests (URL form, dashboard, navbar)
   - Integration tests for user flows
   - Authentication flow tests
   - API integration tests

3. **Database Tests (`packages/db/`)**
   - Prisma schema tests
   - Seed script tests
   - Migration tests

4. **End-to-End Tests**
   - Complete user journey tests (sign up → create URL → redirect)
   - Cross-browser compatibility tests
   - Performance tests

**Testing Framework Recommendations:**
- **Backend**: Jest with Supertest for API testing
- **Frontend**: Jest + React Testing Library or Vitest + Testing Library
- **E2E**: Playwright or Cypress
- **Database**: Jest with test database setup

**Test Infrastructure Needs:**
- Test database configuration
- Mock data factories
- Test utilities and helpers
- CI/CD integration for automated testing

**Benefits:**
- Prevent regressions during refactoring
- Ensure authentication security works correctly
- Validate URL shortening and analytics accuracy
- Support safe deployment to production
- Enable confident code changes and feature additions

**Files to Create:**
- Test configuration files (`jest.config.js`, `vitest.config.ts`)
- `apps/api/src/__tests__/` - API test suite
- `apps/web/src/__tests__/` - Frontend test suite  
- `packages/db/__tests__/` - Database test suite
- `tests/e2e/` - End-to-end test suite
- Test utilities and factories
- GitHub Actions workflow integration for automated testing
