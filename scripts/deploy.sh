#!/bin/bash

# ===========================================
# STEMUC AUDIO FORGE - DEPLOY SCRIPT
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting Stemuc Audio Forge deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    log_success "All prerequisites checked!"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    log_success "Frontend built successfully!"
}

# Deploy to Vercel
deploy_frontend() {
    log_info "Deploying frontend to Vercel..."
    
    # Deploy to Vercel
    vercel --prod
    
    log_success "Frontend deployed to Vercel!"
    
    # Get Vercel URL
    VERCEL_URL=$(vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*\.vercel\.app' | head -1)
    if [ ! -z "$VERCEL_URL" ]; then
        log_success "Frontend URL: $VERCEL_URL"
        echo "FRONTEND_URL=$VERCEL_URL" >> .env.deploy
    fi
}

# Deploy to Railway
deploy_backend() {
    log_info "Deploying backend to Railway..."
    
    # Check if logged in to Railway
    if ! railway whoami &> /dev/null; then
        log_warning "Not logged in to Railway. Please run: railway login"
        railway login
    fi
    
    # Deploy to Railway
    railway up
    
    log_success "Backend deployed to Railway!"
    
    # Get Railway URL (this might need manual update)
    log_warning "Please update the Railway URL in your frontend environment variables"
    log_info "You can find your Railway URL in the Railway dashboard"
}

# Update environment variables
update_env_vars() {
    log_info "Don't forget to set these environment variables in Railway:"
    echo ""
    echo "Required variables:"
    echo "- HUGGINGFACE_TOKEN=your_token_here"
    echo "- NODE_ENV=production"
    echo "- MAX_FILE_SIZE=209715200"
    echo "- USE_GPU=false"
    echo ""
    echo "Optional:"
    echo "- PYANNOTE_API_KEY=your_api_key_here"
    echo "- FRONTEND_URL=https://your-app.vercel.app"
    echo ""
    log_info "Set these in Railway dashboard: Settings > Environment > Variables"
}

# Main deployment flow
main() {
    echo "🎵 Stemuc Audio Forge Deployment"
    echo "================================"
    echo ""
    
    check_prerequisites
    echo ""
    
    # Ask user what to deploy
    echo "What would you like to deploy?"
    echo "1) Frontend only (Vercel)"
    echo "2) Backend only (Railway)" 
    echo "3) Both (Full deployment)"
    echo ""
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            build_frontend
            deploy_frontend
            ;;
        2)
            deploy_backend
            update_env_vars
            ;;
        3)
            build_frontend
            deploy_frontend
            echo ""
            deploy_backend
            echo ""
            update_env_vars
            ;;
        *)
            log_error "Invalid option selected"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "Deployment completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Railway dashboard"
    echo "2. Update CORS origins with your actual URLs"
    echo "3. Test the deployed application"
    echo ""
    echo "Happy audio processing! 🎵"
}

# Run main function
main "$@" 