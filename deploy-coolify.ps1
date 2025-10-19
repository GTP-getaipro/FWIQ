# FloWorx Coolify Deployment Script (PowerShell)
# This script helps prepare and deploy FloWorx to Coolify

Write-Host "🚀 FloWorx Coolify Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the FloWorx root directory" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if required files exist
Write-Host "🔍 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "Dockerfile",
    "backend/Dockerfile",
    "docker-compose.yml",
    "coolify.yml"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Error: Required file $file not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Found $file" -ForegroundColor Green
}

# Check if environment variables are set
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow

$requiredEnvVars = @(
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "N8N_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET"
)

$missingVars = @()
foreach ($var in $requiredEnvVars) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Error: Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these variables in your Coolify project settings." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All required environment variables are set" -ForegroundColor Green

# Test Docker builds
Write-Host "🔨 Testing Docker builds..." -ForegroundColor Yellow

Write-Host "Building frontend..."
try {
    docker build -t floworx-frontend-test . | Out-Null
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building backend..."
try {
    docker build -t floworx-backend-test ./backend | Out-Null
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

# Clean up test images
try {
    docker rmi floworx-frontend-test floworx-backend-test | Out-Null
} catch {
    # Ignore cleanup errors
}

Write-Host ""
Write-Host "🎉 All checks passed! Your application is ready for Coolify deployment." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your code to your Git repository" -ForegroundColor White
Write-Host "2. Create a new project in Coolify" -ForegroundColor White
Write-Host "3. Connect your repository to Coolify" -ForegroundColor White
Write-Host "4. Set the environment variables in Coolify project settings" -ForegroundColor White
Write-Host "5. Deploy using the coolify.yml configuration" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see: docs/deployment/COOLIFY_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Happy deploying!" -ForegroundColor Green
