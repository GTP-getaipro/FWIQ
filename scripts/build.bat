@echo off
REM FloWorx Build Script for Windows
REM Comprehensive build script for frontend and backend

setlocal enabledelayedexpansion

REM Configuration
set NODE_VERSION=18
set BUILD_DIR=dist
set BACKEND_BUILD_DIR=backend\dist

echo 🚀 FloWorx Build Script
echo ================================

REM Function to print colored output (simplified for Windows)
:print_status
echo ✅ %~1
goto :eof

:print_warning
echo ⚠️  %~1
goto :eof

:print_error
echo ❌ %~1
goto :eof

:print_info
echo ℹ️  %~1
goto :eof

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 exit /b 1

REM Install dependencies
call :install_dependencies
if errorlevel 1 exit /b 1

REM Run linting
call :run_linting

REM Run type checking
call :run_type_checking

REM Run tests
call :run_tests

REM Build frontend
call :build_frontend
if errorlevel 1 exit /b 1

REM Build backend
call :build_backend

REM Optimize build
call :optimize_build

REM Generate build info
call :generate_build_info

REM Docker build (optional)
if "%1"=="--docker" call :docker_build

REM Cleanup
call :cleanup

call :print_status "Build completed successfully"
call :print_info "Frontend build available in: %BUILD_DIR%"
if exist "backend\%BACKEND_BUILD_DIR%" call :print_info "Backend build available in: backend\%BACKEND_BUILD_DIR%"

exit /b 0

REM Function implementations
:check_prerequisites
call :print_info "Checking prerequisites..."

where node >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js %NODE_VERSION% or later."
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    call :print_error "npm is not installed. Please install npm."
    exit /b 1
)

call :print_status "Prerequisites check passed"
exit /b 0

:install_dependencies
call :print_info "Installing dependencies..."

npm ci
if errorlevel 1 (
    call :print_error "Failed to install root dependencies"
    exit /b 1
)

if exist "backend" (
    cd backend
    npm ci
    if errorlevel 1 (
        call :print_error "Failed to install backend dependencies"
        cd ..
        exit /b 1
    )
    cd ..
)

call :print_status "Dependencies installed successfully"
exit /b 0

:run_linting
call :print_info "Running linting..."

npm run lint >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend linting failed - continuing with build"
) else (
    call :print_status "Frontend linting passed"
)

if exist "backend" (
    cd backend
    npm run lint >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend linting failed - continuing with build"
    ) else (
        call :print_status "Backend linting passed"
    )
    cd ..
)
exit /b 0

:run_type_checking
call :print_info "Running type checking..."

npm run type-check >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend type checking failed - continuing with build"
) else (
    call :print_status "Frontend type checking passed"
)

if exist "backend" (
    cd backend
    npm run type-check >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend type checking failed - continuing with build"
    ) else (
        call :print_status "Backend type checking passed"
    )
    cd ..
)
exit /b 0

:run_tests
call :print_info "Running tests..."

npm run test:unit >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend tests failed - continuing with build"
) else (
    call :print_status "Frontend tests passed"
)

if exist "backend" (
    cd backend
    npm run test >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend tests failed - continuing with build"
    ) else (
        call :print_status "Backend tests passed"
    )
    cd ..
)
exit /b 0

:build_frontend
call :print_info "Building frontend..."

if "%VITE_SUPABASE_URL%"=="" call :print_warning "VITE_SUPABASE_URL not set - using default values"
if "%VITE_SUPABASE_ANON_KEY%"=="" call :print_warning "VITE_SUPABASE_ANON_KEY not set - using default values"

npm run build
if errorlevel 1 (
    call :print_error "Frontend build failed"
    exit /b 1
)

if exist "%BUILD_DIR%" (
    call :print_status "Frontend build completed successfully"
    call :print_info "Frontend build size: %BUILD_DIR%"
) else (
    call :print_error "Frontend build failed - %BUILD_DIR% not found"
    exit /b 1
)
exit /b 0

:build_backend
if exist "backend" (
    call :print_info "Building backend..."
    
    cd backend
    npm run build >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend build failed - continuing without backend build"
    ) else (
        call :print_status "Backend build completed successfully"
        if exist "%BACKEND_BUILD_DIR%" call :print_info "Backend build size: %BACKEND_BUILD_DIR%"
    )
    cd ..
) else (
    call :print_info "Backend directory not found - skipping backend build"
)
exit /b 0

:optimize_build
call :print_info "Optimizing build..."

REM Remove unnecessary files
if exist "%BUILD_DIR%" (
    for /r "%BUILD_DIR%" %%f in (*.map) do del "%%f" >nul 2>&1
    for /r "%BUILD_DIR%" %%f in (*.ts) do del "%%f" >nul 2>&1
    for /r "%BUILD_DIR%" %%f in (*.tsx) do del "%%f" >nul 2>&1
)

call :print_status "Build optimization completed"
exit /b 0

:generate_build_info
call :print_info "Generating build information..."

set BUILD_INFO_FILE=%BUILD_DIR%\build-info.json

(
echo {
echo   "buildTime": "%date% %time%",
echo   "gitCommit": "unknown",
echo   "gitBranch": "unknown",
echo   "nodeVersion": "unknown",
echo   "npmVersion": "unknown",
echo   "buildEnvironment": "%NODE_ENV%",
echo   "version": "1.0.0"
echo }
) > "%BUILD_INFO_FILE%"

call :print_status "Build information generated: %BUILD_INFO_FILE%"
exit /b 0

:docker_build
call :print_info "Building Docker images..."

where docker >nul 2>&1
if errorlevel 1 (
    call :print_warning "Docker not available - skipping Docker build"
    exit /b 0
)

if exist "Dockerfile.frontend" (
    docker build -f Dockerfile.frontend -t floworx-frontend:latest .
    if errorlevel 1 (
        call :print_warning "Frontend Docker build failed"
    ) else (
        call :print_status "Frontend Docker image built successfully"
    )
)

if exist "Dockerfile.backend" (
    docker build -f Dockerfile.backend -t floworx-backend:latest .
    if errorlevel 1 (
        call :print_warning "Backend Docker build failed"
    ) else (
        call :print_status "Backend Docker image built successfully"
    )
)
exit /b 0

:cleanup
call :print_info "Cleaning up..."

REM Remove temporary files
if exist ".next" rmdir /s /q ".next" >nul 2>&1
if exist ".nuxt" rmdir /s /q ".nuxt" >nul 2>&1
if exist ".cache" rmdir /s /q ".cache" >nul 2>&1

call :print_status "Cleanup completed"
exit /b 0
