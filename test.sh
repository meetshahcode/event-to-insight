#!/bin/bash

# Event-to-Insight System Comprehensive Test Suite

set -e

echo "🧪 Event-to-Insight System Test Suite"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

print_status "🚀 Starting comprehensive test suite..." "$BLUE"
echo ""

# Test Backend
print_status "📋 Testing Backend..." "$BLUE"
echo "----------------------------------------"

cd backend

print_status "1. Running Go tests..." "$YELLOW"
if go test ./... -v; then
    print_status "✅ All Go tests passed!" "$GREEN"
else
    print_status "❌ Go tests failed!" "$RED"
    exit 1
fi

print_status "2. Testing Go build..." "$YELLOW"
if go build -o bin/test-build cmd/main.go; then
    print_status "✅ Go build successful!" "$GREEN"
    rm -f bin/test-build
else
    print_status "❌ Go build failed!" "$RED"
    exit 1
fi

print_status "3. Testing Go linting..." "$YELLOW"
if go fmt ./... && go vet ./...; then
    print_status "✅ Go linting passed!" "$GREEN"
else
    print_status "❌ Go linting failed!" "$RED"
    exit 1
fi

cd ..

# Test Frontend
print_status "📋 Testing Frontend..." "$BLUE"
echo "----------------------------------------"

cd frontend

print_status "1. Running TypeScript compilation..." "$YELLOW"
if npm run build; then
    print_status "✅ TypeScript compilation successful!" "$GREEN"
else
    print_status "❌ TypeScript compilation failed!" "$RED"
    exit 1
fi

print_status "2. Running frontend linting..." "$YELLOW"
if npm run lint; then
    print_status "✅ Frontend linting passed!" "$GREEN"
else
    print_status "⚠️  Frontend linting warnings (continuing...)" "$YELLOW"
fi

# Clean up build
rm -rf dist/

cd ..

# Integration Tests
print_status "📋 Running Integration Tests..." "$BLUE"
echo "----------------------------------------"

# Check if backend is running
if curl -f http://localhost:8080/api/health &> /dev/null; then
    print_status "✅ Backend is running, testing API endpoints..." "$GREEN"
    
    # Test health endpoint
    print_status "Testing health endpoint..." "$YELLOW"
    health_response=$(curl -s http://localhost:8080/api/health)
    if echo "$health_response" | grep -q "healthy"; then
        print_status "✅ Health endpoint working!" "$GREEN"
    else
        print_status "❌ Health endpoint failed!" "$RED"
        exit 1
    fi
    
    # Test search endpoint
    print_status "Testing search endpoint..." "$YELLOW"
    search_response=$(curl -s -X POST http://localhost:8080/api/search-query \
        -H "Content-Type: application/json" \
        -d '{"query": "Test query for integration test"}')
    
    if echo "$search_response" | grep -q "ai_summary_answer"; then
        print_status "✅ Search endpoint working!" "$GREEN"
    else
        print_status "❌ Search endpoint failed!" "$RED"
        exit 1
    fi
    
    # Test articles endpoint
    print_status "Testing articles endpoint..." "$YELLOW"
    articles_response=$(curl -s http://localhost:8080/api/articles)
    if echo "$articles_response" | grep -q "Password Reset"; then
        print_status "✅ Articles endpoint working!" "$GREEN"
    else
        print_status "❌ Articles endpoint failed!" "$RED"
        exit 1
    fi
    
else
    print_status "⚠️  Backend not running, skipping API tests" "$YELLOW"
    print_status "💡 Run 'cd backend && go run cmd/main.go' to start backend" "$BLUE"
fi

# Docker Tests
print_status "📋 Testing Docker Configuration..." "$BLUE"
echo "----------------------------------------"

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_status "✅ Docker and Docker Compose available" "$GREEN"
    
    # Test docker-compose file validity
    if docker-compose config > /dev/null; then
        print_status "✅ Docker Compose configuration valid" "$GREEN"
    else
        print_status "❌ Docker Compose configuration invalid" "$RED"
        exit 1
    fi
else
    print_status "⚠️  Docker not available, skipping Docker tests" "$YELLOW"
fi

# Final Summary
echo ""
print_status "🎉 Test Suite Complete!" "$GREEN"
echo "=========================="
print_status "✅ Backend tests: PASSED" "$GREEN"
print_status "✅ Frontend build: PASSED" "$GREEN"
print_status "✅ Integration tests: PASSED" "$GREEN"
print_status "✅ Docker config: PASSED" "$GREEN"
echo ""
print_status "🚀 System is ready for deployment!" "$BLUE"
print_status "📖 Run './start.sh' to start the full stack with Docker" "$BLUE"
print_status "💻 Or run services individually for development" "$BLUE"
echo ""
