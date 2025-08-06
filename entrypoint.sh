#!/bin/sh

echo "🚀 GeoTwin Production Server Starting..."
echo "📍 TILE_SERVER_URL: $TILE_SERVER_URL"
echo "📍 PROXY_URL: $PROXY_URL"
echo "📍 NODE_ENV: $NODE_ENV"

# Ensure we're in the right directory
cd /usr/src/app

# List contents to verify build directory exists
echo "📁 Contents of /usr/src/app:"
ls -la

# Check if we're in the wrong directory
echo "📁 Contents of /usr/src/builder (if exists):"
ls -la /usr/src/builder/ 2>/dev/null || echo "Builder directory not found"

echo "📁 Contents of /usr/src/builder/build (if exists):"
ls -la /usr/src/builder/build/ 2>/dev/null || echo "Builder build directory not found"

echo "📁 Looking for build files in /usr/src/builder:"
find /usr/src/builder -name "index.js" -o -name "*.html" 2>/dev/null || echo "No build files found"

echo "📁 Looking for any .js files in /usr/src/builder:"
find /usr/src/builder -name "*.js" | head -10 2>/dev/null || echo "No JS files found"

# Check if build directory exists
if [ -d "./build" ]; then
    echo "✅ Build directory found"
    ls -la ./build
else
    echo "❌ Build directory not found!"
    exit 1
fi

# Start the production server
echo "🌐 Starting http-server on port 8080..."
exec http-server ./build -p 8080 --cors -a 0.0.0.0
