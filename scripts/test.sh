#!/bin/bash

# FloWorx Test Script
# Comprehensive testing script for frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18"
TEST_RESULTS_DIR="test-results"
COVERAGE_DIR="coverage"

echo -e "${BLUE}🧪 FloWorx Test Script${NC}"
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

# Create test results directory
setup_test_environment() {
    print_info "Setting up test environment..."
    
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$COVERAGE_DIR"
    
    # Set test environment variables
    export NODE_ENV=test
    export CI=true
    
    print_status "Test environment setup completed"
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

# Run unit tests
run_unit_tests() {
    print_info "Running unit tests..."
    
    # Frontend unit tests
    if npm run test:unit 2>/dev/null; then
        print_status "Frontend unit tests passed"
    else
        print_warning "Frontend unit tests failed"
        return 1
    fi
    
    # Backend unit tests
    if [ -d "backend" ]; then
        cd backend
        if npm run test 2>/dev/null; then
            print_status "Backend unit tests passed"
            cd ..
        else
            print_warning "Backend unit tests failed"
            cd ..
            return 1
        fi
    fi
    
    return 0
}

# Run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    
    # Start test services if needed
    start_test_services
    
    # Frontend integration tests
    if npm run test:integration 2>/dev/null; then
        print_status "Frontend integration tests passed"
    else
        print_warning "Frontend integration tests failed"
        stop_test_services
        return 1
    fi
    
    # Backend integration tests
    if [ -d "backend" ]; then
        cd backend
        if npm run test:integration 2>/dev/null; then
            print_status "Backend integration tests passed"
            cd ..
        else
            print_warning "Backend integration tests failed"
            cd ..
            stop_test_services
            return 1
        fi
    fi
    
    stop_test_services
    return 0
}

# Run end-to-end tests
run_e2e_tests() {
    print_info "Running end-to-end tests..."
    
    # Check if Cypress is available
    if ! command_exists npx; then
        print_warning "npx not available - skipping E2E tests"
        return 0
    fi
    
    # Start application for E2E tests
    start_application_for_e2e
    
    # Run E2E tests
    if npm run test:e2e 2>/dev/null; then
        print_status "End-to-end tests passed"
    else
        print_warning "End-to-end tests failed"
        stop_application_for_e2e
        return 1
    fi
    
    stop_application_for_e2e
    return 0
}

# Run performance tests
run_performance_tests() {
    print_info "Running performance tests..."
    
    # Check if Lighthouse CI is available
    if ! command_exists npx; then
        print_warning "npx not available - skipping performance tests"
        return 0
    fi
    
    # Start application for performance tests
    start_application_for_performance
    
    # Run Lighthouse CI
    if npx lighthouse-ci autorun 2>/dev/null; then
        print_status "Performance tests passed"
    else
        print_warning "Performance tests failed"
        stop_application_for_performance
        return 1
    fi
    
    stop_application_for_performance
    return 0
}

# Run accessibility tests
run_accessibility_tests() {
    print_info "Running accessibility tests..."
    
    # Check if axe-core is available
    if ! command_exists npx; then
        print_warning "npx not available - skipping accessibility tests"
        return 0
    fi
    
    # Start application for accessibility tests
    start_application_for_a11y
    
    # Run accessibility tests
    if npm run test:a11y 2>/dev/null; then
        print_status "Accessibility tests passed"
    else
        print_warning "Accessibility tests failed"
        stop_application_for_a11y
        return 1
    fi
    
    stop_application_for_a11y
    return 0
}

# Start test services (PostgreSQL, Redis, etc.)
start_test_services() {
    print_info "Starting test services..."
    
    # Start PostgreSQL for testing
    if command_exists docker && command_exists docker-compose; then
        if [ -f "docker-compose.test.yml" ]; then
            docker-compose -f docker-compose.test.yml up -d
            sleep 10  # Wait for services to start
            print_status "Test services started"
        else
            print_warning "docker-compose.test.yml not found - skipping test services"
        fi
    else
        print_warning "Docker not available - skipping test services"
    fi
}

# Stop test services
stop_test_services() {
    print_info "Stopping test services..."
    
    if command_exists docker && command_exists docker-compose; then
        if [ -f "docker-compose.test.yml" ]; then
            docker-compose -f docker-compose.test.yml down
            print_status "Test services stopped"
        fi
    fi
}

# Start application for E2E tests
start_application_for_e2e() {
    print_info "Starting application for E2E tests..."
    
    # Build application
    npm run build
    
    # Start application in background
    npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 30
    
    # Check if application is running
    if curl -f http://localhost:3000/health 2>/dev/null; then
        print_status "Application started for E2E tests (PID: $APP_PID)"
    else
        print_error "Failed to start application for E2E tests"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
}

# Stop application for E2E tests
stop_application_for_e2e() {
    print_info "Stopping application for E2E tests..."
    
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        print_status "Application stopped"
    fi
}

# Start application for performance tests
start_application_for_performance() {
    print_info "Starting application for performance tests..."
    
    # Build application
    npm run build
    
    # Start application in background
    npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 30
    
    print_status "Application started for performance tests (PID: $APP_PID)"
}

# Stop application for performance tests
stop_application_for_performance() {
    print_info "Stopping application for performance tests..."
    
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        print_status "Application stopped"
    fi
}

# Start application for accessibility tests
start_application_for_a11y() {
    print_info "Starting application for accessibility tests..."
    
    # Build application
    npm run build
    
    # Start application in background
    npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 30
    
    print_status "Application started for accessibility tests (PID: $APP_PID)"
}

# Stop application for accessibility tests
stop_application_for_a11y() {
    print_info "Stopping application for accessibility tests..."
    
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        print_status "Application stopped"
    fi
}

# Generate test coverage report
generate_coverage_report() {
    print_info "Generating test coverage report..."
    
    # Frontend coverage
    if [ -d "coverage" ]; then
        cp -r coverage "$COVERAGE_DIR/frontend"
        print_status "Frontend coverage report generated"
    fi
    
    # Backend coverage
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage "$COVERAGE_DIR/backend"
        print_status "Backend coverage report generated"
    fi
    
    # Generate combined coverage report
    if [ -d "$COVERAGE_DIR" ]; then
        print_info "Coverage reports available in: $COVERAGE_DIR"
    fi
}

# Generate test results summary
generate_test_summary() {
    print_info "Generating test results summary..."
    
    local summary_file="$TEST_RESULTS_DIR/test-summary.md"
    
    cat > "$summary_file" << EOF
# 🧪 FloWorx Test Results Summary

**Generated:** $(date)
**Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')
**Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')

## Test Results

### Unit Tests
- Frontend: $([ -f "test-results/frontend-unit.json" ] && echo "✅ Passed" || echo "❌ Failed")
- Backend: $([ -f "test-results/backend-unit.json" ] && echo "✅ Passed" || echo "❌ Failed")

### Integration Tests
- Frontend: $([ -f "test-results/frontend-integration.json" ] && echo "✅ Passed" || echo "❌ Failed")
- Backend: $([ -f "test-results/backend-integration.json" ] && echo "✅ Passed" || echo "❌ Failed")

### End-to-End Tests
- E2E: $([ -f "test-results/e2e.json" ] && echo "✅ Passed" || echo "❌ Failed")

### Performance Tests
- Performance: $([ -f "test-results/performance.json" ] && echo "✅ Passed" || echo "❌ Failed")

### Accessibility Tests
- A11y: $([ -f "test-results/a11y.json" ] && echo "✅ Passed" || echo "❌ Failed")

## Coverage Reports
- Frontend Coverage: $([ -d "coverage/frontend" ] && echo "✅ Available" || echo "❌ Not Available")
- Backend Coverage: $([ -d "coverage/backend" ] && echo "✅ Available" || echo "❌ Not Available")

## Recommendations
- Review failed tests and fix any issues
- Maintain test coverage above 80%
- Run tests before each deployment
- Update tests when adding new features
EOF
    
    print_status "Test summary generated: $summary_file"
}

# Cleanup test artifacts
cleanup() {
    print_info "Cleaning up test artifacts..."
    
    # Remove temporary files
    rm -rf .nyc_output 2>/dev/null || true
    rm -rf .coverage 2>/dev/null || true
    
    # Stop any running processes
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node.*test" 2>/dev/null || true
    
    print_status "Cleanup completed"
}

# Main test process
main() {
    local start_time=$(date +%s)
    local test_results=()
    
    # Parse command line arguments
    SKIP_UNIT=false
    SKIP_INTEGRATION=false
    SKIP_E2E=false
    SKIP_PERFORMANCE=false
    SKIP_ACCESSIBILITY=false
    COVERAGE_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-unit)
                SKIP_UNIT=true
                shift
                ;;
            --skip-integration)
                SKIP_INTEGRATION=true
                shift
                ;;
            --skip-e2e)
                SKIP_E2E=true
                shift
                ;;
            --skip-performance)
                SKIP_PERFORMANCE=true
                shift
                ;;
            --skip-accessibility)
                SKIP_ACCESSIBILITY=true
                shift
                ;;
            --coverage-only)
                COVERAGE_ONLY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-unit           Skip unit tests"
                echo "  --skip-integration    Skip integration tests"
                echo "  --skip-e2e           Skip end-to-end tests"
                echo "  --skip-performance   Skip performance tests"
                echo "  --skip-accessibility Skip accessibility tests"
                echo "  --coverage-only      Only generate coverage reports"
                echo "  --help               Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run test steps
    check_prerequisites
    setup_test_environment
    install_dependencies
    
    if [ "$COVERAGE_ONLY" = false ]; then
        if [ "$SKIP_UNIT" = false ]; then
            if run_unit_tests; then
                test_results+=("Unit Tests: ✅ Passed")
            else
                test_results+=("Unit Tests: ❌ Failed")
            fi
        fi
        
        if [ "$SKIP_INTEGRATION" = false ]; then
            if run_integration_tests; then
                test_results+=("Integration Tests: ✅ Passed")
            else
                test_results+=("Integration Tests: ❌ Failed")
            fi
        fi
        
        if [ "$SKIP_E2E" = false ]; then
            if run_e2e_tests; then
                test_results+=("E2E Tests: ✅ Passed")
            else
                test_results+=("E2E Tests: ❌ Failed")
            fi
        fi
        
        if [ "$SKIP_PERFORMANCE" = false ]; then
            if run_performance_tests; then
                test_results+=("Performance Tests: ✅ Passed")
            else
                test_results+=("Performance Tests: ❌ Failed")
            fi
        fi
        
        if [ "$SKIP_ACCESSIBILITY" = false ]; then
            if run_accessibility_tests; then
                test_results+=("Accessibility Tests: ✅ Passed")
            else
                test_results+=("Accessibility Tests: ❌ Failed")
            fi
        fi
    fi
    
    generate_coverage_report
    generate_test_summary
    
    # Calculate test time
    local end_time=$(date +%s)
    local test_time=$((end_time - start_time))
    
    # Print test results summary
    echo ""
    echo "================================"
    print_info "Test Results Summary:"
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    echo ""
    print_status "Testing completed in ${test_time}s"
    print_info "Test results available in: $TEST_RESULTS_DIR"
    print_info "Coverage reports available in: $COVERAGE_DIR"
    
    # Exit with error code if any tests failed
    local failed_tests=0
    for result in "${test_results[@]}"; do
        if [[ $result == *"❌ Failed"* ]]; then
            ((failed_tests++))
        fi
    done
    
    if [ $failed_tests -gt 0 ]; then
        print_error "$failed_tests test suite(s) failed"
        exit 1
    else
        print_status "All tests passed successfully"
        exit 0
    fi
}

# Run main function with all arguments
main "$@"
