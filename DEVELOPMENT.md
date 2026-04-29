# Development Guide for TES MVP

This guide covers everything needed to set up and develop the TES MVP application locally.

## Prerequisites

- **Node.js**: v18 or later
- **npm**: v9 or later (or yarn/bun)
- **Docker**: Latest version (for containerized development)
- **Docker Compose**: v2 or later
- **PostgreSQL**: v14+ (if running without Docker)
- **Redis**: v7+ (if running without Docker)
- **Git**: Latest version

## Local Setup (Without Docker)

### 1. Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd tes-mvp

# Install Node dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local configuration
# Required variables:
# - NODE_ENV=development
# - DATABASE_URL=postgresql://user:password@localhost:5432/tes_db
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your-secret-key (use any string for development)
# - ADMIN_USERNAME=admin
# - ADMIN_PASSWORD=admin
```

### 3. Database Setup

```bash
# Create PostgreSQL database (if not using Docker)
createdb tes_db

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Start Development Server

```bash
# Terminal 1: Start the main application
npm run dev

# Terminal 2 (optional): Watch TypeScript compilation
npm run build:watch

# Terminal 3 (optional): Watch tests
npm run test:watch
```

The application will be available at `http://localhost:3001`

## Docker Setup (Recommended for Development)

### 1. Start Development Environment

```bash
# Start all services
./scripts/start-dev.sh

# This starts:
# - Node.js application (port 3001)
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - Adminer (port 8080) - Database admin tool
# - Nginx (port 80)
# - Prometheus (port 9090)
# - Grafana (port 3000)
```

### 2. Access Services

- **Application**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Adminer**: http://localhost:8080
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

### 3. Stop Development Environment

```bash
# Stop all services
./scripts/stop-dev.sh

# Clean stop with volume removal
./scripts/stop-dev.sh --clean
```

## Database Management

### Migrations

```bash
# Run pending migrations
npm run db:migrate

# Create new migration
npm run db:create-migration -- --name your_migration_name

# Rollback last migration
npm run db:rollback
```

### Drizzle ORM Commands

```bash
# Generate schema from TypeScript
npm run db:generate

# Open Drizzle Studio (visual database editor)
npm run db:studio

# Reset database (WARNING: destructive)
npm run db:reset
```

### Database Seeding

```bash
# Seed sample data
npm run db:seed

# Clear all data
npm run db:clear
```

## Code Organization

```
src/
├── controllers/       # Route handlers
├── routes/           # Express route definitions
├── middleware/       # Express middleware
├── db/               # Database configuration and migrations
├── types/            # TypeScript type definitions
├── cache.ts          # Redis caching layer
├── cloudwatch.ts     # AWS CloudWatch integration
├── logger.ts         # Structured logging
├── monitoring.ts     # Prometheus metrics
├── websocket.ts      # WebSocket server
├── index.ts          # Application entry point
└── ...
```

## npm Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:watch` - Watch mode for TypeScript compilation

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting

### Database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:generate` - Generate Drizzle schema
- `npm run db:studio` - Open Drizzle Studio

### Production
- `npm run start` - Start production server
- `npm run build` - Build for production

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests for specific file
npm test -- path/to/test.spec.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Integration Tests

```bash
# Start Docker environment first
./scripts/start-dev.sh

# Run integration tests
npm run test:integration
```

### API Testing

Use Postman or similar tools. Example:

```bash
# Get health status
curl http://localhost:3001/health

# Create a task (requires authentication)
curl -X POST http://localhost:3001/api/v1/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","projectId":"...","status":"todo"}'
```

## Environment Variables

### Core Configuration
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3001)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DB_MIGRATION_DIR` - Path to migrations directory

### Redis
- `REDIS_URL` - Redis connection string

### Authentication
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time

### Admin User
- `ADMIN_USERNAME` - Admin account username
- `ADMIN_PASSWORD` - Admin account password

### AWS (if using CloudWatch)
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### Monitoring
- `PROMETHEUS_ENABLED` - Enable Prometheus metrics
- `CLOUDWATCH_ENABLED` - Enable CloudWatch integration

See `.env.example` for complete list with defaults.

## Common Development Tasks

### Adding a New API Endpoint

1. **Create controller** in `src/controllers/`
2. **Create route** in `src/routes/`
3. **Add route to index.ts**
4. **Write tests** in `src/__tests__/`
5. **Update API.md** documentation

### Adding a Database Table

1. **Create schema** in `src/db/schema.ts`
2. **Create migration** using `npm run db:create-migration`
3. **Run migration** with `npm run db:migrate`
4. **Generate types** with `npm run db:generate`
5. **Update DATABASE_SCHEMA.md**

### Debugging

```bash
# Start with Node debugger
node --inspect=0.0.0.0:9229 dist/index.js

# Connect Chrome DevTools to chrome://inspect
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://user:password@localhost:5432/tes_db

# Check Redis connection
redis-cli ping
```

### Docker Issues

```bash
# Clean up all containers and volumes
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Check logs
docker compose logs -f <service-name>
```

### Migration Failures

```bash
# Check migration status
npm run db:migrate -- --status

# Manually rollback
npm run db:rollback

# View migration files
ls -la src/db/migrations/
```

## Performance Optimization

### Caching

The application uses Redis for caching. Configure cache behavior in `src/cache.ts`.

```javascript
// Example: cache API responses
cacheMiddleware(300) // 5 minutes
```

### Database Queries

- Use indexes for frequently queried fields
- Avoid N+1 queries; use relations
- Monitor slow queries in logs

### Monitoring

Access Grafana dashboard at `http://localhost:3000` to monitor:
- Request latency
- Database query performance
- Memory usage
- Error rates

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature develop

# Make changes and commit
git commit -m "feat: describe your feature"

# Push to remote
git push origin feature/your-feature

# Create Pull Request to develop branch
```

## Deployment Preparation

Before deploying to production:

1. Ensure all tests pass: `npm test`
2. Check code quality: `npm run lint`
3. Build production bundle: `npm run build`
4. Test production build locally: `npm run start`
5. Review DEPLOYMENT.md for production setup

## Getting Help

- Check existing issues: https://github.com/your-repo/issues
- Review architecture: See ARCHITECTURE.md
- API documentation: See API.md
- Database schema: See DATABASE_SCHEMA.md

## Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
