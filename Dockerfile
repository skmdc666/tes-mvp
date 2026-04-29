# Multi-stage build for optimized production image
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Create non-root user for security
RUN addgroup --system app && adduser --system --group app
RUN chown -R app:app /app
USER app

# Build the application (if needed)
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system app && adduser --system --group app

# Copy built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist  # If you have a build output
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public  # If you have static files
COPY --from=builder /app/logs ./logs

# Set proper permissions
RUN chown -R app:app /app && chmod +x /app/scripts

# Switch to non-root user
USER app

# Create necessary directories
RUN mkdir -p /app/logs && touch /app/logs/app.log

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]