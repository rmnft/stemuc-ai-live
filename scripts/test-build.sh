#!/bin/bash

# Test Build Script for Vercel Deployment
echo "🚀 Testing Stemuc Audio Forge Build Process"
echo "============================================"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Creating from template..."
    if [ -f "env.production.template" ]; then
        cp env.production.template .env.production
        echo "✅ Created .env.production from template"
    else
        echo "❌ Template file not found. Please create .env.production manually:"
        echo "VITE_API_URL=https://stemuc-ai-live-production.up.railway.app"
        exit 1
    fi
fi

# Show current environment variables
echo ""
echo "📋 Current Environment Variables:"
echo "================================="
cat .env.production

# Clean previous build
echo ""
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📁 Build output in dist/ directory"
    
    # Show build size
    if command -v du &> /dev/null; then
        echo "📊 Build size:"
        du -sh dist/
    fi
    
    # Test preview server
    echo ""
    echo "🌐 Starting preview server..."
    echo "Press Ctrl+C to stop"
    npm run preview
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi 