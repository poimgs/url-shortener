# URL Shortener

A modern, scalable URL shortener built with a full-stack TypeScript monorepo architecture.

## 🏗️ Architecture

This project uses a monorepo structure with npm workspaces:

- **Frontend**: Next.js 13 (App Router) with React, TypeScript, Tailwind CSS
- **Backend**: Express.js with tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth providers
- **Infrastructure**: AWS (RDS, App Runner, Amplify) managed with Terraform
- **CI/CD**: GitHub Actions for automated testing and deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS Account (for deployment)
- GitHub account (for OAuth and CI/CD)

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

3. **Start local database**
   ```bash
   npm run docker:up
   ```

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start:
- API server at http://localhost:4000
- Web app at http://localhost:3000
- Database at localhost:5432

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations

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

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: NextAuth.js secret key
- `GITHUB_CLIENT_ID/SECRET`: GitHub OAuth credentials
- `AWS_*`: AWS credentials for deployment

### Database Schema

The application uses Prisma with the following main models:
- `User`: User accounts and authentication
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

- CORS protection
- Helmet.js security headers
- Input validation with Zod
- SQL injection protection with Prisma
- Automated security scanning in CI/CD

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.