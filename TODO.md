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