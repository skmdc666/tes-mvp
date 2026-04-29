#!/bin/bash

# TES MVP Development Environment Stop Script
# This script stops the Docker development environment

set -e

echo "🛑 Stopping TES MVP Development Environment..."

# Stop all Docker Compose services
echo "🐳 Stopping Docker services..."
docker-compose down

# Stop and remove containers, networks, and volumes if requested
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning up volumes and networks..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleaned up all volumes and networks"
fi

echo "🎉 Development environment stopped!"
echo ""
echo "💡 To restart: ./scripts/start-dev.sh"
echo "💡 To start fresh: ./scripts/start-dev.sh --clean"