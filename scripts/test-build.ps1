# Test Build Script for Vercel Deployment (PowerShell)
Write-Host "🚀 Testing Stemuc Audio Forge Build Process" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  .env.production not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.production.template") {
        Copy-Item "env.production.template" ".env.production"
        Write-Host "✅ Created .env.production from template" -ForegroundColor Green
    } else {
        Write-Host "❌ Template file not found. Please create .env.production manually:" -ForegroundColor Red
        Write-Host "VITE_API_URL=https://stemuc-ai-live-production.up.railway.app" -ForegroundColor Yellow
        exit 1
    }
}

# Show current environment variables
Write-Host ""
Write-Host "📋 Current Environment Variables:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Get-Content ".env.production"

# Clean previous build
Write-Host ""
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the project
Write-Host ""
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📁 Build output in dist/ directory" -ForegroundColor Green
    
    # Show build size
    if (Test-Path "dist") {
        $size = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
        $sizeInMB = [math]::Round($size / 1MB, 2)
        Write-Host "📊 Build size: $sizeInMB MB" -ForegroundColor Cyan
    }
    
    # Test preview server
    Write-Host ""
    Write-Host "🌐 Starting preview server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    npm run preview
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
} 