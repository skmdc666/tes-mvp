# TES (The Expanse Solutions) MVP

A task management application built with Node.js, Express.js, PostgreSQL, and Docker.

## Features

- Task management with CRUD operations
- Project organization
- User management
- REST API with comprehensive validation
- Docker-based development environment
- PostgreSQL database with Drizzle ORM
- Redis caching
- Monitoring with Prometheus and Grafana
- Production-ready containerization

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Prometheus, Grafana
- **Deployment**: Railway
- **Development**: Docker Compose

## Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tes-mvp
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development environment**
   ```bash
   ./scripts/start-dev.sh
   ```

4. **Access the application**
   - Application: http://localhost:3001
   - Health Check: http://localhost:3001/health
   - Adminer (DB Admin): http://localhost:8080

### Production Deployment

1. **Build production image**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start production environment**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Access the application**
   - Application: http://localhost:3001
   - Nginx: http://localhost (port 80)
   - Grafana: http://localhost:3000 (admin/admin)
   - Prometheus: http://localhost:9090

## Development Scripts

- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run build` - Build the application
- `./scripts/start-dev.sh` - Start Docker development environment
- `./scripts/stop-dev.sh` - Stop Docker development environment
- `./scripts/stop-dev.sh --clean` - Clean stop with volume removal

## Database Management

- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:generate` - Generate Drizzle schema
- `npm run db:studio` - Open Drizzle studio

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Docker Compose Files

- `docker-compose.yml` - Base configuration
- `docker-compose.override.yml` - Development overrides
- `docker-compose.prod.yml` - Production configuration
- `docker/development/docker-compose.dev.yml` - Development-only services

## Environment Variables

See `.env.example` for all required environment variables.

## Monitoring

The application includes comprehensive monitoring:

- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **Nginx**: Access and error logs
- **Application**: Structured logging

## Security Features

- Non-root user in containers
- SSL/TLS support
- Rate limiting
- Input validation
- CORS protection
- Helmet.js security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License