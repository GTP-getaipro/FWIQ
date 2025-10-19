#!/bin/bash

# FloWorx Coolify Deployment Script
# This script helps prepare and deploy FloWorx to Coolify

set -e

echo "🚀 FloWorx Coolify Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the FloWorx root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if required files exist
echo "🔍 Checking required files..."

required_files=(
    "Dockerfile"
    "backend/Dockerfile"
    "docker-compose.yml"
    "coolify.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found"
        exit 1
    fi
    echo "✅ Found $file"
done

# Check if environment variables are set
echo "🔍 Checking environment variables..."

required_env_vars=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "N8N_API_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "MICROSOFT_CLIENT_ID"
    "MICROSOFT_CLIENT_SECRET"
)

missing_vars=()
for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set these variables in your Coolify project settings."
    exit 1
fi

echo "✅ All required environment variables are set"

# Test Docker builds
echo "🔨 Testing Docker builds..."

echo "Building frontend..."
if docker build -t floworx-frontend-test . > /dev/null 2>&1; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "Building backend..."
if docker build -t floworx-backend-test ./backend > /dev/null 2>&1; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Clean up test images
docker rmi floworx-frontend-test floworx-backend-test > /dev/null 2>&1

echo ""
echo "🎉 All checks passed! Your application is ready for Coolify deployment."
echo ""
echo "📋 Next steps:"
echo "1. Push your code to your Git repository"
echo "2. Create a new project in Coolify"
echo "3. Connect your repository to Coolify"
echo "4. Set the environment variables in Coolify project settings"
echo "5. Deploy using the coolify.yml configuration"
echo ""
echo "📚 For detailed instructions, see: docs/deployment/COOLIFY_DEPLOYMENT_GUIDE.md"
echo ""
echo "🚀 Happy deploying!"
