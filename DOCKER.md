# Docker Development Environment

This document provides comprehensive instructions for setting up and working with the Docker development environment for the TES MVP project.

## Quick Start

### Prerequisites
- Docker (version 20.10 or later)
- Docker Compose (version 1.29 or later)

### Starting the Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd tes-mvp

# Start development environment
./scripts/start-dev.sh

# Or manually:
npm run docker:dev:detached
```

### Accessing the Application

- **Application**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Database**: localhost:5432
  - Database: tes_mvp_dev
  - Username: tes_user_dev
  - Password: tes_password_dev

## Development Workflow

### 1. Start Development Environment

```bash
# Using the provided script
./scripts/start-dev.sh

# Or using npm scripts
npm run docker:dev:detached
```

### 2. Make Code Changes

The development environment is set up with hot-reloading:

```bash
# Code changes will automatically trigger restart
# Monitor logs:
npm run docker:dev
```

### 3. Stop Development Environment

```bash
# Using the provided script
./scripts/stop-dev.sh

# Or using npm scripts
npm run docker:stop:dev
```

## Docker Services

### Application Service (`app`)
- **Image**: Built from `Dockerfile.dev`
- **Port**: 3001
- **Environment**: Development mode
- **Volumes**:
  - Source code mounted for hot-reloading
  - Node modules isolated
  - .env file mounted

### Database Service (`db`)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: tes_mvp_dev
- **User**: tes_user_dev
- **Password**: tes_password_dev
- **Volumes**:
  - Persistent data storage
  - Initialization scripts

## Database Management

### View Database Logs

```bash
docker-compose -f docker-compose.dev.yml logs -f db
```

### Access Database Shell

```bash
docker-compose -f docker-compose.dev.yml exec -T psql -U tes_user_dev -d tes_mvp_dev
```

### Reset Database

```bash
# WARNING: This will reset your database
npm run db:reset
```

### Run Migrations

```bash
npm run db:migrate
```

## Docker Commands

### Development Environment

```bash
# Build and start in foreground
npm run docker:dev

# Build and start in background
npm run docker:dev:detached

# Stop and remove containers
npm run docker:stop:dev

# View logs
npm run docker:dev:logs
```

### Production Environment

```bash
# Build and start production
npm run docker:prod:detached

# Stop production
npm run docker:stop
```

### System Management

```bash
# View all containers
docker ps -a

# View container logs
docker-compose logs -f [service-name]

# Remove stopped containers
docker-compose rm -f

# Clean up unused resources
docker system prune
```

## Environment Variables

### Application
- `NODE_ENV=development`
- `PORT=3001`
- `DATABASE_URL=postgresql://tes_user_dev:tes_password_dev@localhost:5432/tes_mvp_dev`

### Database
- `POSTGRES_DB=tes_mvp_dev`
- `POSTGRES_USER=tes_user_dev`
- `POSTGRES_PASSWORD=tes_password_dev`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 [PID]
```

### Database Connection Issues

```bash
# Check database container status
docker-compose -f docker-compose.dev.yml ps db

# View database logs
docker-compose -f docker-compose.dev.yml logs db
```

### Permission Issues

```bash
# Ensure scripts are executable
chmod +x scripts/*.sh

# Fix Docker permissions (if needed)
sudo chown -R $USER:$USER .
```

## Development Best Practices

1. **Always use .env files**: Never commit sensitive configuration to version control
2. **Use proper Docker volumes**: Mount source code for development, avoid mounting node_modules
3. **Health checks**: Monitor application health via the `/health` endpoint
4. **Database migrations**: Run migrations after schema changes
5. **Clean up**: Stop containers when not in use to save resources

## Production Considerations

For production deployment:

1. Use `docker-compose.yml` (not `docker-compose.dev.yml`)
2. Set `NODE_ENV=production`
3. Use production database credentials
4. Implement proper logging and monitoring
5. Set up backup strategies for database

## Security Notes

- Development database uses default credentials - change in production
- Container ports should be bound to localhost only
- Use Docker secrets for production secrets
- Keep images updated with security patches

## Contributing

When contributing to this Docker setup:

1. Test all Docker commands locally
2. Update this documentation for any new scripts or configurations
3. Ensure production and development environments are properly separated
4. Add appropriate .dockerignore entries