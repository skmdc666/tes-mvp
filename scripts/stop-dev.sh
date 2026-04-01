#!/bin/bash

# TES MVP Development Environment Stop Script
# This script stops the Docker development environment

set -e

echo "🛑 Stopping TES MVP Development Environment..."

# Stop services
echo "🐳 Stopping Docker containers..."
docker-compose -f docker-compose.dev.yml down -v --remove-orphans

# Clean up build cache (optional)
read -p "🧹 Clean up Docker build cache? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up Docker build cache..."
    docker system prune -f
    echo "✅ Docker cache cleaned"
fi

echo "🎉 Development environment stopped!"