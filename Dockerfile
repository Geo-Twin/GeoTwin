# GeoTwin - Advanced 3D Flood Risk Assessment Platform
# Multi-stage Docker build for production deployment

FROM node:20-alpine as builder

# Install git for dependency resolution
RUN apk add --no-cache git

WORKDIR /usr/src/builder

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as runner
WORKDIR /usr/src/app

# Copy built application
COPY --from=builder /usr/src/builder/build ./build

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Install image optimization tools and curl for health checks
RUN apk add --no-cache pngquant curl

# Optimize PNG images for better performance
RUN find ./build -type f -name "*.png" \
    -exec pngquant --force --quality 65-80 --skip-if-larger --output {} {} \; || true

# Install production server
RUN npm install --global http-server

# Create non-root user for security
RUN addgroup -g 1001 -S geotwin && \
    adduser -S geotwin -u 1001

# Change ownership of app directory
RUN chown -R geotwin:geotwin /usr/src/app

# Switch to non-root user
USER geotwin

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]