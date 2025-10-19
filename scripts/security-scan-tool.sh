#!/bin/bash

# FloWorx Security Scan Tool
# 
# This script performs comprehensive security analysis including:
# - Static code analysis for vulnerabilities
# - Dependency vulnerability scanning
# - Environment variable security checks
# - Authentication and authorization validation
# - Data encryption verification
# 
# Usage: ./scripts/security-scan-tool.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create audit reports directory
mkdir -p audit-reports

# Initialize results
SECURITY_RESULTS="audit-reports/security-scan-results.json"
echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","totalChecks":0,"passed":0,"failed":0,"warnings":[],"errors":[],"vulnerabilities":[],"securityTests":{}}' > "$SECURITY_RESULTS"

# Function to add result
add_result() {
    local check_type="$1"
    local status="$2"
    local message="$3"
    local details="$4"
    
    # Update JSON results
    jq --arg type "$check_type" --arg status "$status" --arg message "$message" --arg details "$details" \
       '.totalChecks += 1 | 
        if $status == "PASSED" then .passed += 1 else .failed += 1 end |
        .securityTests[$type] = {"status": $status, "message": $message, "details": $details}' \
       "$SECURITY_RESULTS" > tmp.json && mv tmp.json "$SECURITY_RESULTS"
}

# Function to add vulnerability
add_vulnerability() {
    local severity="$1"
    local type="$2"
    local description="$3"
    local file="$4"
    local line="$5"
    
    jq --arg severity "$severity" --arg type "$type" --arg description "$description" --arg file "$file" --arg line "$line" \
       '.vulnerabilities += [{"severity": $severity, "type": $type, "description": $description, "file": $file, "line": $line}]' \
       "$SECURITY_RESULTS" > tmp.json && mv tmp.json "$SECURITY_RESULTS"
}

echo -e "${BLUE}🔒 Starting FloWorx Security Scan...${NC}\n"

# 1. Dependency Vulnerability Scan
echo -e "${BLUE}📦 Scanning for dependency vulnerabilities...${NC}"
if command -v npm audit &> /dev/null; then
    if npm audit --audit-level=moderate --json > audit-reports/npm-audit.json 2>/dev/null; then
        echo -e "${GREEN}✅ No critical dependency vulnerabilities found${NC}"
        add_result "dependency_scan" "PASSED" "No critical dependency vulnerabilities" "npm audit completed successfully"
    else
        echo -e "${RED}❌ Dependency vulnerabilities found${NC}"
        add_result "dependency_scan" "FAILED" "Critical dependency vulnerabilities detected" "Check audit-reports/npm-audit.json for details"
        
        # Extract high/critical vulnerabilities
        npm audit --audit-level=moderate --json 2>/dev/null | jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "high" or .value.severity == "critical") | "\(.value.severity): \(.key) - \(.value.title)"' | while read -r vuln; do
            add_vulnerability "high" "dependency" "$vuln" "package.json" "N/A"
        done
    fi
else
    echo -e "${YELLOW}⚠️ npm audit not available, skipping dependency scan${NC}"
    add_result "dependency_scan" "SKIPPED" "npm audit not available" "Dependency scanning skipped"
fi

# 2. Environment Variable Security Check
echo -e "${BLUE}🔐 Checking environment variable security...${NC}"
ENV_ISSUES=0

# Check for hardcoded secrets in code
if grep -r -i "password\|secret\|key\|token" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" src/ | grep -v "process.env\|import.meta.env" | grep -v "//.*password\|//.*secret" | head -5; then
    echo -e "${RED}❌ Potential hardcoded secrets found${NC}"
    add_vulnerability "high" "hardcoded_secret" "Potential hardcoded secrets in source code" "src/" "N/A"
    ENV_ISSUES=$((ENV_ISSUES + 1))
else
    echo -e "${GREEN}✅ No hardcoded secrets detected${NC}"
fi

# Check environment file security
if [ -f ".env" ]; then
    echo -e "${RED}❌ .env file found in repository (should be gitignored)${NC}"
    add_vulnerability "critical" "exposed_env" ".env file found in repository" ".env" "N/A"
    ENV_ISSUES=$((ENV_ISSUES + 1))
else
    echo -e "${GREEN}✅ No .env file in repository${NC}"
fi

# Check for example env files with real credentials
if grep -q "your-actual-" env.example 2>/dev/null || grep -q "sk-" env.example 2>/dev/null; then
    echo -e "${RED}❌ Example env file contains potential real credentials${NC}"
    add_vulnerability "high" "exposed_credential" "Example env file contains potential real credentials" "env.example" "N/A"
    ENV_ISSUES=$((ENV_ISSUES + 1))
else
    echo -e "${GREEN}✅ Example env file is secure${NC}"
fi

if [ $ENV_ISSUES -eq 0 ]; then
    add_result "env_security" "PASSED" "Environment variable security checks passed" "No security issues found"
else
    add_result "env_security" "FAILED" "Environment variable security issues found" "$ENV_ISSUES issues detected"
fi

# 3. Authentication Security Check
echo -e "${BLUE}🔑 Checking authentication security...${NC}"
AUTH_ISSUES=0

# Check for proper JWT handling
if grep -r "localStorage.*token\|sessionStorage.*token" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${YELLOW}⚠️ Tokens stored in localStorage/sessionStorage detected${NC}"
    add_vulnerability "medium" "token_storage" "Tokens stored in browser storage" "src/" "N/A"
    AUTH_ISSUES=$((AUTH_ISSUES + 1))
fi

# Check for proper session handling
if grep -r "supabase.*auth" src/ --include="*.js" --include="*.jsx" | grep -v "signOut\|getSession" | head -3; then
    echo -e "${GREEN}✅ Proper Supabase auth usage detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited Supabase auth usage detected${NC}"
fi

# Check for CSRF protection
if grep -r "csrf\|xsrf" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ CSRF protection detected${NC}"
else
    echo -e "${YELLOW}⚠️ No explicit CSRF protection detected${NC}"
    add_vulnerability "medium" "csrf_protection" "No explicit CSRF protection detected" "src/" "N/A"
    AUTH_ISSUES=$((AUTH_ISSUES + 1))
fi

if [ $AUTH_ISSUES -eq 0 ]; then
    add_result "auth_security" "PASSED" "Authentication security checks passed" "No critical issues found"
else
    add_result "auth_security" "FAILED" "Authentication security issues found" "$AUTH_ISSUES issues detected"
fi

# 4. Data Encryption Check
echo -e "${BLUE}🔐 Checking data encryption...${NC}"
ENCRYPTION_ISSUES=0

# Check for encryption usage
if grep -r "crypto\|encrypt\|decrypt" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ Encryption functions detected${NC}"
else
    echo -e "${YELLOW}⚠️ No explicit encryption functions detected${NC}"
    add_vulnerability "medium" "encryption" "No explicit encryption functions detected" "src/" "N/A"
    ENCRYPTION_ISSUES=$((ENCRYPTION_ISSUES + 1))
fi

# Check for HTTPS enforcement
if grep -r "https\|ssl\|tls" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ HTTPS/SSL usage detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited HTTPS/SSL usage detected${NC}"
fi

if [ $ENCRYPTION_ISSUES -eq 0 ]; then
    add_result "encryption_security" "PASSED" "Data encryption checks passed" "Encryption functions detected"
else
    add_result "encryption_security" "FAILED" "Data encryption issues found" "$ENCRYPTION_ISSUES issues detected"
fi

# 5. Input Validation Check
echo -e "${BLUE}🛡️ Checking input validation...${NC}"
INPUT_ISSUES=0

# Check for SQL injection protection
if grep -r "supabase\|prepared" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ Supabase (parameterized queries) usage detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited parameterized query usage detected${NC}"
    add_vulnerability "high" "sql_injection" "Limited parameterized query usage" "src/" "N/A"
    INPUT_ISSUES=$((INPUT_ISSUES + 1))
fi

# Check for XSS protection
if grep -r "dompurify\|sanitize\|escape" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ XSS protection detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited XSS protection detected${NC}"
    add_vulnerability "medium" "xss_protection" "Limited XSS protection detected" "src/" "N/A"
    INPUT_ISSUES=$((INPUT_ISSUES + 1))
fi

# Check for form validation
if grep -r "validation\|validate" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ Form validation detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited form validation detected${NC}"
    add_vulnerability "medium" "input_validation" "Limited form validation detected" "src/" "N/A"
    INPUT_ISSUES=$((INPUT_ISSUES + 1))
fi

if [ $INPUT_ISSUES -eq 0 ]; then
    add_result "input_validation" "PASSED" "Input validation checks passed" "Good validation practices detected"
else
    add_result "input_validation" "FAILED" "Input validation issues found" "$INPUT_ISSUES issues detected"
fi

# 6. Authorization Check
echo -e "${BLUE}👤 Checking authorization...${NC}"
AUTHZ_ISSUES=0

# Check for RLS policies
if grep -r "rls\|row.*level.*security" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ RLS (Row Level Security) usage detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited RLS usage detected${NC}"
    add_vulnerability "high" "authorization" "Limited RLS usage detected" "src/" "N/A"
    AUTHZ_ISSUES=$((AUTHZ_ISSUES + 1))
fi

# Check for user context validation
if grep -r "user.*id\|auth.*uid" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ User context validation detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited user context validation detected${NC}"
    add_vulnerability "medium" "user_context" "Limited user context validation detected" "src/" "N/A"
    AUTHZ_ISSUES=$((AUTHZ_ISSUES + 1))
fi

if [ $AUTHZ_ISSUES -eq 0 ]; then
    add_result "authorization" "PASSED" "Authorization checks passed" "Good authorization practices detected"
else
    add_result "authorization" "FAILED" "Authorization issues found" "$AUTHZ_ISSUES issues detected"
fi

# 7. API Security Check
echo -e "${BLUE}🌐 Checking API security...${NC}"
API_ISSUES=0

# Check for API rate limiting
if grep -r "rate.*limit\|throttle" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ Rate limiting detected${NC}"
else
    echo -e "${YELLOW}⚠️ No explicit rate limiting detected${NC}"
    add_vulnerability "medium" "rate_limiting" "No explicit rate limiting detected" "src/" "N/A"
    API_ISSUES=$((API_ISSUES + 1))
fi

# Check for CORS configuration
if grep -r "cors\|origin" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ CORS configuration detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited CORS configuration detected${NC}"
    add_vulnerability "medium" "cors_config" "Limited CORS configuration detected" "src/" "N/A"
    API_ISSUES=$((API_ISSUES + 1))
fi

if [ $API_ISSUES -eq 0 ]; then
    add_result "api_security" "PASSED" "API security checks passed" "Good API security practices detected"
else
    add_result "api_security" "FAILED" "API security issues found" "$API_ISSUES issues detected"
fi

# 8. File Upload Security Check
echo -e "${BLUE}📁 Checking file upload security...${NC}"
UPLOAD_ISSUES=0

# Check for file type validation
if grep -r "file.*type\|mime.*type\|extension" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ File type validation detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited file type validation detected${NC}"
    add_vulnerability "medium" "file_validation" "Limited file type validation detected" "src/" "N/A"
    UPLOAD_ISSUES=$((UPLOAD_ISSUES + 1))
fi

# Check for file size limits
if grep -r "file.*size\|max.*size" src/ --include="*.js" --include="*.jsx" | head -3; then
    echo -e "${GREEN}✅ File size limits detected${NC}"
else
    echo -e "${YELLOW}⚠️ Limited file size limits detected${NC}"
    add_vulnerability "medium" "file_size" "Limited file size limits detected" "src/" "N/A"
    UPLOAD_ISSUES=$((UPLOAD_ISSUES + 1))
fi

if [ $UPLOAD_ISSUES -eq 0 ]; then
    add_result "file_upload_security" "PASSED" "File upload security checks passed" "Good file upload practices detected"
else
    add_result "file_upload_security" "FAILED" "File upload security issues found" "$UPLOAD_ISSUES issues detected"
fi

# Generate final report
echo -e "\n${BLUE}📊 SECURITY SCAN RESULTS${NC}"
echo -e "${BLUE}========================${NC}"

# Calculate totals
TOTAL_CHECKS=$(jq '.totalChecks' "$SECURITY_RESULTS")
PASSED_CHECKS=$(jq '.passed' "$SECURITY_RESULTS")
FAILED_CHECKS=$(jq '.failed' "$SECURITY_RESULTS")
VULNERABILITY_COUNT=$(jq '.vulnerabilities | length' "$SECURITY_RESULTS")

echo -e "Total Checks: ${TOTAL_CHECKS}"
echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed: ${RED}${FAILED_CHECKS}${NC}"
echo -e "Vulnerabilities Found: ${RED}${VULNERABILITY_COUNT}${NC}"

if [ "$VULNERABILITY_COUNT" -gt 0 ]; then
    echo -e "\n${RED}🚨 VULNERABILITIES DETECTED:${NC}"
    jq -r '.vulnerabilities[] | "\(.severity | ascii_upcase): \(.type) - \(.description)"' "$SECURITY_RESULTS"
fi

# Determine overall status
if [ "$FAILED_CHECKS" -eq 0 ] && [ "$VULNERABILITY_COUNT" -eq 0 ]; then
    echo -e "\n${GREEN}🎯 Overall Security Status: PASSED${NC}"
    OVERALL_STATUS="PASSED"
else
    echo -e "\n${RED}🎯 Overall Security Status: FAILED${NC}"
    OVERALL_STATUS="FAILED"
fi

# Update final status
jq --arg status "$OVERALL_STATUS" '.overallStatus = $status' "$SECURITY_RESULTS" > tmp.json && mv tmp.json "$SECURITY_RESULTS"

echo -e "\n${BLUE}📄 Detailed report saved to: ${SECURITY_RESULTS}${NC}"

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "PASSED" ]; then
    exit 0
else
    exit 1
fi
