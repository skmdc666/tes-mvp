#!/bin/bash

# TES MVP Development Environment Startup Script
# This script starts the Docker development environment

set -e

echo "🚀 Starting TES MVP Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Docker Compose
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U tes_user -d tes_mvp &> /dev/null; do
    echo "Waiting for database..."
    sleep 2
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli ping &> /dev/null; do
    echo "Waiting for Redis..."
    sleep 2
done

# Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
until curl -f http://localhost:3001/health &> /dev/null; do
    echo "Waiting for application..."
    sleep 2
done

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose exec -T app npm run migrate || echo "⚠️  No migrations found"

# Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec -T app npm run db:seed || echo "⚠️  No seed script found"

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Application URL: http://localhost:3001"
echo "📊 Adminer URL: http://localhost:8080"
echo "🔗 Database: postgres://tes_user:tes_password@localhost:5432/tes_mvp"
echo "🔗 Redis: redis://localhost:6379"
echo "📋 Logs: ./logs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo "To reset: docker-compose down -v && docker-compose up --build -d"