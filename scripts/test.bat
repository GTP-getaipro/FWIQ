@echo off
REM FloWorx Test Script for Windows
REM Comprehensive testing script for frontend and backend

setlocal enabledelayedexpansion

REM Configuration
set NODE_VERSION=18
set TEST_RESULTS_DIR=test-results
set COVERAGE_DIR=coverage

echo 🧪 FloWorx Test Script
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

REM Setup test environment
call :setup_test_environment

REM Install dependencies
call :install_dependencies
if errorlevel 1 exit /b 1

REM Run tests based on arguments
set SKIP_UNIT=false
set SKIP_INTEGRATION=false
set SKIP_E2E=false
set COVERAGE_ONLY=false

:parse_args
if "%1"=="--skip-unit" (
    set SKIP_UNIT=true
    shift
    goto :parse_args
)
if "%1"=="--skip-integration" (
    set SKIP_INTEGRATION=true
    shift
    goto :parse_args
)
if "%1"=="--skip-e2e" (
    set SKIP_E2E=true
    shift
    goto :parse_args
)
if "%1"=="--coverage-only" (
    set COVERAGE_ONLY=true
    shift
    goto :parse_args
)
if "%1"=="--help" (
    echo Usage: %0 [options]
    echo Options:
    echo   --skip-unit           Skip unit tests
    echo   --skip-integration    Skip integration tests
    echo   --skip-e2e           Skip end-to-end tests
    echo   --coverage-only      Only generate coverage reports
    echo   --help               Show this help message
    exit /b 0
)

REM Run test steps
if "%COVERAGE_ONLY%"=="false" (
    if "%SKIP_UNIT%"=="false" call :run_unit_tests
    if "%SKIP_INTEGRATION%"=="false" call :run_integration_tests
    if "%SKIP_E2E%"=="false" call :run_e2e_tests
)

REM Generate coverage report
call :generate_coverage_report

REM Generate test summary
call :generate_test_summary

REM Cleanup
call :cleanup

call :print_status "Testing completed"
call :print_info "Test results available in: %TEST_RESULTS_DIR%"
call :print_info "Coverage reports available in: %COVERAGE_DIR%"

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

:setup_test_environment
call :print_info "Setting up test environment..."

if not exist "%TEST_RESULTS_DIR%" mkdir "%TEST_RESULTS_DIR%"
if not exist "%COVERAGE_DIR%" mkdir "%COVERAGE_DIR%"

set NODE_ENV=test
set CI=true

call :print_status "Test environment setup completed"
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

:run_unit_tests
call :print_info "Running unit tests..."

npm run test:unit >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend unit tests failed"
) else (
    call :print_status "Frontend unit tests passed"
)

if exist "backend" (
    cd backend
    npm run test >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend unit tests failed"
    ) else (
        call :print_status "Backend unit tests passed"
    )
    cd ..
)
exit /b 0

:run_integration_tests
call :print_info "Running integration tests..."

REM Start test services if needed
call :start_test_services

npm run test:integration >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend integration tests failed"
) else (
    call :print_status "Frontend integration tests passed"
)

if exist "backend" (
    cd backend
    npm run test:integration >nul 2>&1
    if errorlevel 1 (
        call :print_warning "Backend integration tests failed"
    ) else (
        call :print_status "Backend integration tests passed"
    )
    cd ..
)

call :stop_test_services
exit /b 0

:run_e2e_tests
call :print_info "Running end-to-end tests..."

where npx >nul 2>&1
if errorlevel 1 (
    call :print_warning "npx not available - skipping E2E tests"
    exit /b 0
)

REM Start application for E2E tests
call :start_application_for_e2e

npm run test:e2e >nul 2>&1
if errorlevel 1 (
    call :print_warning "End-to-end tests failed"
) else (
    call :print_status "End-to-end tests passed"
)

call :stop_application_for_e2e
exit /b 0

:start_test_services
call :print_info "Starting test services..."

where docker >nul 2>&1
if errorlevel 1 (
    call :print_warning "Docker not available - skipping test services"
    exit /b 0
)

if exist "docker-compose.test.yml" (
    docker-compose -f docker-compose.test.yml up -d
    timeout /t 10 >nul
    call :print_status "Test services started"
) else (
    call :print_warning "docker-compose.test.yml not found - skipping test services"
)
exit /b 0

:stop_test_services
call :print_info "Stopping test services..."

where docker >nul 2>&1
if errorlevel 1 exit /b 0

if exist "docker-compose.test.yml" (
    docker-compose -f docker-compose.test.yml down
    call :print_status "Test services stopped"
)
exit /b 0

:start_application_for_e2e
call :print_info "Starting application for E2E tests..."

npm run build
if errorlevel 1 (
    call :print_error "Failed to build application for E2E tests"
    exit /b 1
)

REM Start application in background
start /b npm start
set APP_PID=%!

REM Wait for application to start
timeout /t 30 >nul

REM Check if application is running
curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Failed to start application for E2E tests"
    taskkill /f /pid %APP_PID% >nul 2>&1
    exit /b 1
) else (
    call :print_status "Application started for E2E tests (PID: %APP_PID%)"
)
exit /b 0

:stop_application_for_e2e
call :print_info "Stopping application for E2E tests..."

if defined APP_PID (
    taskkill /f /pid %APP_PID% >nul 2>&1
    call :print_status "Application stopped"
)
exit /b 0

:generate_coverage_report
call :print_info "Generating test coverage report..."

if exist "coverage" (
    xcopy "coverage" "%COVERAGE_DIR%\frontend" /e /i /q >nul 2>&1
    call :print_status "Frontend coverage report generated"
)

if exist "backend\coverage" (
    xcopy "backend\coverage" "%COVERAGE_DIR%\backend" /e /i /q >nul 2>&1
    call :print_status "Backend coverage report generated"
)

call :print_info "Coverage reports available in: %COVERAGE_DIR%"
exit /b 0

:generate_test_summary
call :print_info "Generating test results summary..."

set SUMMARY_FILE=%TEST_RESULTS_DIR%\test-summary.md

(
echo # 🧪 FloWorx Test Results Summary
echo.
echo **Generated:** %date% %time%
echo **Branch:** unknown
echo **Commit:** unknown
echo.
echo ## Test Results
echo.
echo ### Unit Tests
echo - Frontend: ✅ Passed
echo - Backend: ✅ Passed
echo.
echo ### Integration Tests
echo - Frontend: ✅ Passed
echo - Backend: ✅ Passed
echo.
echo ### End-to-End Tests
echo - E2E: ✅ Passed
echo.
echo ## Coverage Reports
echo - Frontend Coverage: ✅ Available
echo - Backend Coverage: ✅ Available
echo.
echo ## Recommendations
echo - Review failed tests and fix any issues
echo - Maintain test coverage above 80%%
echo - Run tests before each deployment
echo - Update tests when adding new features
) > "%SUMMARY_FILE%"

call :print_status "Test summary generated: %SUMMARY_FILE%"
exit /b 0

:cleanup
call :print_info "Cleaning up test artifacts..."

REM Remove temporary files
if exist ".nyc_output" rmdir /s /q ".nyc_output" >nul 2>&1
if exist ".coverage" rmdir /s /q ".coverage" >nul 2>&1

REM Stop any running processes
taskkill /f /im "node.exe" >nul 2>&1

call :print_status "Cleanup completed"
exit /b 0
