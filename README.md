# TES MVP

Backend API for The Expanse Solutions MVP.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (REST API + WebSocket)
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **Deployment**: Railway
- **Development**: Docker

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Docker development
docker-compose up
```

## Deployment

 Railway automatically deploys from GitHub main branch. Use branch-specific deployments:

- `main` → Production
- `staging` → Staging environment

## Environment Variables

See `.env.example` for required variables.