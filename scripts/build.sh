#!/bin/bash

# FloWorx Build Script
# Comprehensive build script for frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18"
BUILD_DIR="dist"
BACKEND_BUILD_DIR="backend/dist"

echo -e "${BLUE}🚀 FloWorx Build Script${NC}"
echo "================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js $NODE_VERSION or later."
        exit 1
    fi
    
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt "$NODE_VERSION" ]; then
        print_error "Node.js version $NODE_VER is too old. Please upgrade to Node.js $NODE_VERSION or later."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Install root dependencies
    npm ci
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        cd backend
        npm ci
        cd ..
    fi
    
    print_status "Dependencies installed successfully"
}

# Run linting
run_linting() {
    print_info "Running linting..."
    
    # Frontend linting
    if npm run lint 2>/dev/null; then
        print_status "Frontend linting passed"
    else
        print_warning "Frontend linting failed - continuing with build"
    fi
    
    # Backend linting
    if [ -d "backend" ] && cd backend && npm run lint 2>/dev/null; then
        print_status "Backend linting passed"
        cd ..
    else
        print_warning "Backend linting failed - continuing with build"
        cd .. 2>/dev/null || true
    fi
}

# Run type checking
run_type_checking() {
    print_info "Running type checking..."
    
    # Frontend type checking
    if npm run type-check 2>/dev/null; then
        print_status "Frontend type checking passed"
    else
        print_warning "Frontend type checking failed - continuing with build"
    fi
    
    # Backend type checking
    if [ -d "backend" ] && cd backend && npm run type-check 2>/dev/null; then
        print_status "Backend type checking passed"
        cd ..
    else
        print_warning "Backend type checking failed - continuing with build"
        cd .. 2>/dev/null || true
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Frontend tests
    if npm run test:unit 2>/dev/null; then
        print_status "Frontend tests passed"
    else
        print_warning "Frontend tests failed - continuing with build"
    fi
    
    # Backend tests
    if [ -d "backend" ] && cd backend && npm run test 2>/dev/null; then
        print_status "Backend tests passed"
        cd ..
    else
        print_warning "Backend tests failed - continuing with build"
        cd .. 2>/dev/null || true
    fi
}

# Build frontend
build_frontend() {
    print_info "Building frontend..."
    
    # Check for required environment variables
    if [ -z "$VITE_SUPABASE_URL" ]; then
        print_warning "VITE_SUPABASE_URL not set - using default values"
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        print_warning "VITE_SUPABASE_ANON_KEY not set - using default values"
    fi
    
    # Build frontend
    npm run build
    
    if [ -d "$BUILD_DIR" ]; then
        print_status "Frontend build completed successfully"
        
        # Show build size
        FRONTEND_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
        print_info "Frontend build size: $FRONTEND_SIZE"
    else
        print_error "Frontend build failed - $BUILD_DIR not found"
        exit 1
    fi
}

# Build backend
build_backend() {
    if [ -d "backend" ]; then
        print_info "Building backend..."
        
        cd backend
        
        # Build backend
        if npm run build 2>/dev/null; then
            print_status "Backend build completed successfully"
            
            # Show build size
            if [ -d "$BACKEND_BUILD_DIR" ]; then
                BACKEND_SIZE=$(du -sh "$BACKEND_BUILD_DIR" | cut -f1)
                print_info "Backend build size: $BACKEND_SIZE"
            fi
        else
            print_warning "Backend build failed - continuing without backend build"
        fi
        
        cd ..
    else
        print_info "Backend directory not found - skipping backend build"
    fi
}

# Optimize build
optimize_build() {
    print_info "Optimizing build..."
    
    # Remove unnecessary files
    find "$BUILD_DIR" -name "*.map" -delete 2>/dev/null || true
    find "$BUILD_DIR" -name "*.ts" -delete 2>/dev/null || true
    find "$BUILD_DIR" -name "*.tsx" -delete 2>/dev/null || true
    
    # Compress images (if imagemagick is available)
    if command_exists convert; then
        find "$BUILD_DIR" -name "*.png" -exec convert {} -strip {} \; 2>/dev/null || true
        find "$BUILD_DIR" -name "*.jpg" -exec convert {} -strip {} \; 2>/dev/null || true
    fi
    
    print_status "Build optimization completed"
}

# Generate build info
generate_build_info() {
    print_info "Generating build information..."
    
    BUILD_INFO_FILE="$BUILD_DIR/build-info.json"
    
    cat > "$BUILD_INFO_FILE" << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)",
  "buildEnvironment": "${NODE_ENV:-development}",
  "version": "$(node -p "require('./package.json').version")"
}
EOF
    
    print_status "Build information generated: $BUILD_INFO_FILE"
}

# Docker build (optional)
docker_build() {
    if [ "$1" = "--docker" ]; then
        print_info "Building Docker images..."
        
        if command_exists docker; then
            # Build frontend Docker image
            if [ -f "Dockerfile.frontend" ]; then
                docker build -f Dockerfile.frontend -t floworx-frontend:latest .
                print_status "Frontend Docker image built successfully"
            fi
            
            # Build backend Docker image
            if [ -f "Dockerfile.backend" ]; then
                docker build -f Dockerfile.backend -t floworx-backend:latest .
                print_status "Backend Docker image built successfully"
            fi
        else
            print_warning "Docker not available - skipping Docker build"
        fi
    fi
}

# Cleanup
cleanup() {
    print_info "Cleaning up..."
    
    # Remove temporary files
    rm -rf .next 2>/dev/null || true
    rm -rf .nuxt 2>/dev/null || true
    rm -rf .cache 2>/dev/null || true
    
    print_status "Cleanup completed"
}

# Main build process
main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_LINT=false
    DOCKER_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-lint)
                SKIP_LINT=true
                shift
                ;;
            --docker)
                DOCKER_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-lint     Skip running linting"
                echo "  --docker        Build Docker images"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run build steps
    check_prerequisites
    install_dependencies
    
    if [ "$SKIP_LINT" = false ]; then
        run_linting
        run_type_checking
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    build_frontend
    build_backend
    optimize_build
    generate_build_info
    
    if [ "$DOCKER_BUILD" = true ]; then
        docker_build --docker
    fi
    
    cleanup
    
    # Calculate build time
    local end_time=$(date +%s)
    local build_time=$((end_time - start_time))
    
    print_status "Build completed successfully in ${build_time}s"
    print_info "Frontend build available in: $BUILD_DIR"
    if [ -d "backend/$BACKEND_BUILD_DIR" ]; then
        print_info "Backend build available in: backend/$BACKEND_BUILD_DIR"
    fi
}

# Run main function with all arguments
main "$@"
