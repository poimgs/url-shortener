# URL Shortener

A modern, scalable URL shortener built with a full-stack TypeScript monorepo architecture.

## 🏗️ Architecture

This project uses a monorepo structure with npm workspaces:

- **Frontend**: Next.js 13 (App Router) with React, TypeScript, Tailwind CSS
- **Backend**: Express.js with tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email/password and optional OAuth providers
- **Infrastructure**: AWS (RDS, App Runner, Amplify) managed with Terraform
- **CI/CD**: GitHub Actions for automated testing and deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS Account

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd url-shortener
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Complete setup (one command)**

   ```bash
   npm run setup
   ```

   This will:
   - Start the local PostgreSQL database
   - Wait for database to be ready
   - Generate Prisma client
   - Push database schema

4. **Start development servers**
   ```bash
   npm run dev
   ```

This will start:

- API server at http://localhost:4000
- Web app at http://localhost:3000
- Database at localhost:5432

### Available Scripts

**Development:**

- `npm run setup` - Complete project setup (database + schema)
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages

**Database:**

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:wait` - Wait for database to be ready

**Docker:**

- `npm run docker:up` - Start local database
- `npm run docker:down` - Stop local database

## 🏗️ Project Structure

```
/
├── apps/
│   ├── api/          # Express.js backend with tRPC
│   └── web/          # Next.js frontend
├── packages/
│   ├── db/           # Prisma schema and client
│   └── types/        # Shared TypeScript types
├── infra/            # Terraform AWS infrastructure
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml # Local development database
```

## 🌐 Deployment

The application supports automatic deployment to AWS with two environments:

- **Staging**: Deployed from `develop` branch
- **Production**: Deployed from `main` branch

### Infrastructure

- **Database**: Amazon RDS (PostgreSQL)
- **Backend**: AWS App Runner (containerized)
- **Frontend**: AWS Amplify Hosting
- **Images**: Amazon ECR

### CI/CD Pipeline

1. **Pull Request**: Runs tests, linting, and security scans
2. **Push to develop/main**:
   - Builds and pushes Docker image to ECR
   - Deploys infrastructure with Terraform
   - Runs database migrations
   - Deploys frontend to Amplify

### Setup Deployment

1. **Configure GitHub Secrets**

   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   DB_PASSWORD
   DATABASE_URL
   AMPLIFY_APP_ID
   ```

2. **Initialize Terraform**

   ```bash
   cd infra
   terraform init
   terraform workspace new staging
   terraform workspace new production
   ```

3. **Deploy**
   - Push to `develop` for staging
   - Push to `main` for production

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available environment variables.

**Required variables:**

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: NextAuth.js secret key
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

**Optional variables:**

- `GITHUB_CLIENT_ID/SECRET`: GitHub OAuth credentials (for GitHub login)
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth credentials (for Google login)
- `AWS_*`: AWS credentials (for deployment only)

**Authentication Options:**

- **Email/Password**: Works out of the box, no OAuth setup required
- **OAuth Providers**: Optional, add GitHub/Google credentials to enable social login

### Database Schema

The application uses Prisma with the following main models:

- `User`: User accounts and authentication (supports both email/password and OAuth)
- `Url`: Shortened URLs with analytics
- `Click`: Click tracking and analytics

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific workspace tests
npm run test --workspace=apps/api
```

## 📝 API Documentation

The API is built with tRPC, providing end-to-end type safety. Key endpoints:

- `url.create`: Create a new shortened URL
- `url.redirect`: Get original URL for redirection
- `url.getStats`: Get URL statistics
- `url.getUserUrls`: Get user's URLs (paginated)

## 🔒 Security

- **Authentication**: Email/password with bcrypt hashing + optional OAuth
- **CORS protection**: Configured for frontend/backend communication
- **Security headers**: Helmet.js protection
- **Input validation**: Zod schema validation on all endpoints
- **SQL injection protection**: Prisma ORM with parameterized queries
- **Automated security scanning**: CI/CD pipeline security checks
