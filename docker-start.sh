#!/bin/bash

# GeoTwin Docker Deployment Script
# Comprehensive startup script for the GeoTwin flood assessment platform

set -e

echo "🌊 Starting GeoTwin - Advanced 3D Flood Risk Assessment Platform"
echo "================================================================"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if embedded tiles exist
TILES_PATH="./tiles/tiles.mbtiles"
if [ ! -f "$TILES_PATH" ]; then
    echo "❌ Embedded tiles file not found at $TILES_PATH"
    echo "GeoTwin requires embedded map tiles for self-contained deployment."
    echo "Please ensure tiles/tiles.mbtiles exists in the GeoTwin directory."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Parse command line arguments
MODE="production"
REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev|--development)
            MODE="development"
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev, --development    Start in development mode"
            echo "  --rebuild              Force rebuild of Docker images"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     Start in production mode"
            echo "  $0 --dev               Start in development mode"
            echo "  $0 --rebuild           Rebuild and start in production mode"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set Docker Compose files based on mode
if [ "$MODE" = "development" ]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.override.yml"
    echo "🔧 Starting in development mode"
else
    COMPOSE_FILES="-f docker-compose.yml"
    echo "🚀 Starting in production mode"
fi

# Rebuild if requested
if [ "$REBUILD" = true ]; then
    echo "🔨 Rebuilding Docker images..."
    docker-compose $COMPOSE_FILES build --no-cache
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose $COMPOSE_FILES down

# Start the services
echo "🌊 Starting GeoTwin services..."
docker-compose $COMPOSE_FILES up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check GeoTwin app
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ GeoTwin App is running at http://localhost:8080"
else
    echo "⚠️  GeoTwin App may still be starting up..."
fi

# Check proxy server
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ CORS Proxy is running at http://localhost:3001"
else
    echo "⚠️  CORS Proxy may still be starting up..."
fi

# Check tile server
if curl -f http://localhost:8081 >/dev/null 2>&1; then
    echo "✅ Tile Server is running at http://localhost:8081"
else
    echo "⚠️  Tile Server may still be starting up..."
fi

echo ""
echo "🎉 GeoTwin deployment complete!"
echo ""
echo "Services:"
echo "  📱 GeoTwin App:    http://localhost:8080"
echo "  🔗 CORS Proxy:     http://localhost:3001"
echo "  🗺️  Tile Server:    http://localhost:8081"
echo ""
echo "To view logs: docker-compose $COMPOSE_FILES logs -f"
echo "To stop:      docker-compose $COMPOSE_FILES down"
echo ""
echo "Happy flood risk assessment! 🌊"
