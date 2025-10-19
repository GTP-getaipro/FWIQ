#!/bin/bash

# Database Schema Validation Execution Script
# This script provides an easy way to run the database schema validation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_status $BLUE "=========================================="
    print_status $BLUE "$1"
    print_status $BLUE "=========================================="
    echo ""
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

print_warning() {
    print_status $YELLOW "⚠️  $1"
}

# Check if we're in the right directory
if [ ! -f "scripts/post-deployment-schema-validator.js" ]; then
    print_error "Schema validator script not found!"
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_header "Database Schema Validation Script"
print_status $BLUE "Validating database schema for Tickets #91, #92, #93"

# Check for required environment variables
print_header "Checking Environment Variables"

if [ -z "$VITE_SUPABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    print_error "Missing VITE_SUPABASE_URL or SUPABASE_URL environment variable"
    print_warning "Please set one of these variables:"
    print_warning "  export VITE_SUPABASE_URL='https://your-project.supabase.co'"
    print_warning "  export SUPABASE_URL='https://your-project.supabase.co'"
    exit 1
else
    SUPABASE_URL=${VITE_SUPABASE_URL:-$SUPABASE_URL}
    print_success "Supabase URL found: $SUPABASE_URL"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -z "$SUPABASE_SERVICE_KEY" ]; then
    print_error "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY environment variable"
    print_warning "Please set one of these variables:"
    print_warning "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    print_warning "  export SUPABASE_SERVICE_KEY='your-service-role-key'"
    exit 1
else
    SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_SERVICE_KEY}
    print_success "Service role key found"
fi

# Check if Node.js is available
print_header "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_warning "Please install Node.js to run the validation script"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
fi

# Check if the validation script exists and is executable
if [ ! -f "scripts/post-deployment-schema-validator.js" ]; then
    print_error "Validation script not found at scripts/post-deployment-schema-validator.js"
    exit 1
else
    print_success "Validation script found"
fi

# Make the script executable
chmod +x scripts/post-deployment-schema-validator.js

# Run the validation
print_header "Running Database Schema Validation"

print_status $BLUE "Starting validation process..."
print_status $BLUE "This may take a few minutes depending on database size..."

# Set environment variables for the script
export VITE_SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"

# Run the validation script
if node scripts/post-deployment-schema-validator.js; then
    print_header "Validation Results"
    print_success "Database schema validation completed successfully!"
    print_success "All required tables, columns, indexes, and constraints are in place."
    print_success "The database is ready for production deployment."
    
    # Check if validation report was generated
    if [ -f "validation-report.json" ]; then
        print_success "Detailed validation report saved to: validation-report.json"
        
        # Show summary from the report
        if command -v jq &> /dev/null; then
            echo ""
            print_status $BLUE "Validation Summary:"
            jq -r '.summary | "Total Tests: \(.total), Passed: \(.passed), Failed: \(.failed), Warnings: \(.warnings)"' validation-report.json
        fi
    fi
    
    echo ""
    print_status $GREEN "🎉 Database schema validation PASSED!"
    print_status $GREEN "You can now proceed with production deployment."
    
else
    print_header "Validation Results"
    print_error "Database schema validation FAILED!"
    print_error "Please review the errors above and fix the issues before proceeding."
    
    # Check if validation report was generated
    if [ -f "validation-report.json" ]; then
        print_warning "Detailed validation report saved to: validation-report.json"
        
        # Show failed tests from the report
        if command -v jq &> /dev/null; then
            echo ""
            print_status $RED "Failed Tests:"
            jq -r '.errors[] | "- \(.test): \(.message)"' validation-report.json
        fi
    fi
    
    echo ""
    print_status $RED "💥 Database schema validation FAILED!"
    print_status $RED "Please fix the issues and run the validation again."
    
    exit 1
fi

# Optional: Run tests if available
if [ -f "tests/database-schema-validation.test.js" ]; then
    print_header "Running Validation Tests"
    
    if command -v npm &> /dev/null; then
        print_status $BLUE "Running Jest tests for validation..."
        if npm test tests/database-schema-validation.test.js; then
            print_success "Validation tests passed!"
        else
            print_warning "Some validation tests failed, but this doesn't affect the main validation"
        fi
    else
        print_warning "npm not found, skipping test execution"
    fi
fi

print_header "Next Steps"
print_status $BLUE "1. Review the validation report (validation-report.json)"
print_status $BLUE "2. Deploy the database schema to production"
print_status $BLUE "3. Run application tests to verify functionality"
print_status $BLUE "4. Monitor database performance"
print_status $BLUE "5. Update documentation with schema changes"

echo ""
print_status $GREEN "Database schema validation completed!"
