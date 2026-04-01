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

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please update .env with your database configuration"
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U tes_user_dev -d tes_mvp_dev; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Run database migrations if needed
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.dev.yml exec -T app npm run migrate || echo "⚠️  No migrations found"

# Show status
echo "📊 Development Environment Status:"
echo "   🌐 Application: http://localhost:3001"
echo "   📊 Health Check: http://localhost:3001/health"
echo "   🗄️  Database: localhost:5432"
echo "   📖 Database: tes_mvp_dev"
echo "   👤 User: tes_user_dev"
echo "   🔑 Password: tes_password_dev"

echo "🎉 Development environment is ready!"
echo "💡 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "💡 To stop: docker-compose -f docker-compose.dev.yml down"