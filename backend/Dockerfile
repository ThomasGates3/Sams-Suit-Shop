# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files only
COPY package*.json ./

# Install all dependencies (including dev dependencies for npm run dev in docker-compose)
# Using npm install instead of npm ci to rebuild native modules for Alpine Linux
RUN npm install --no-save

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy source for development
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) {console.error('Health check failed'); process.exit(1)}}).on('error', () => process.exit(1))"

# Start application - use compiled JS by default, but support dev mode
CMD ["node", "dist/index.js"]