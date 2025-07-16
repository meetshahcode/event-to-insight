#!/bin/bash

# Event-to-Insight System Status Check

echo "🔍 Event-to-Insight System Status"
echo "=================================="
echo ""

# Check if services are running
echo "📊 Service Status:"
echo "-------------------"

# Check backend
if curl -f http://localhost:8080/api/health &> /dev/null; then
    echo "✅ Backend: RUNNING (http://localhost:8080)"
    
    # Get backend info
    health_info=$(curl -s http://localhost:8080/api/health)
    echo "   Status: $(echo $health_info | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    echo "   Service: $(echo $health_info | grep -o '"service":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Backend: NOT RUNNING"
    echo "   💡 Start with: cd backend && go run cmd/main.go"
fi

# Check frontend
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend: RUNNING (http://localhost:3000)"
else
    echo "❌ Frontend: NOT RUNNING"
    echo "   💡 Start with: cd frontend && npm run dev"
fi

echo ""

# Check database
echo "💾 Database Status:"
echo "-------------------"
if [ -f "backend/data.db" ] || [ -f "data.db" ]; then
    echo "✅ Database: EXISTS"
    
    # Count records if backend is running
    if curl -f http://localhost:8080/api/health &> /dev/null; then
        articles_count=$(curl -s http://localhost:8080/api/articles | grep -o '"id":[0-9]*' | wc -l)
        echo "   Articles: $articles_count"
    fi
else
    echo "⚠️  Database: NOT FOUND (will be created on first run)"
fi

echo ""

# Check Docker
echo "🐳 Docker Status:"
echo "-----------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker: INSTALLED"
    docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo "   Version: $docker_version"
    
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose: INSTALLED"
        compose_version=$(docker-compose --version | cut -d' ' -f4 | tr -d ',')
        echo "   Version: $compose_version"
    else
        echo "❌ Docker Compose: NOT INSTALLED"
    fi
else
    echo "❌ Docker: NOT INSTALLED"
fi

echo ""

# Check recent queries (if backend is running and has data)
echo "🔍 Recent Activity:"
echo "-------------------"
if curl -f http://localhost:8080/api/health &> /dev/null; then
    # Try a sample query to see if system is working
    sample_response=$(curl -s -X POST http://localhost:8080/api/search-query \
        -H "Content-Type: application/json" \
        -d '{"query": "system status check"}' 2>/dev/null)
    
    if echo "$sample_response" | grep -q "ai_summary_answer"; then
        echo "✅ Search functionality: WORKING"
        echo "✅ AI service: RESPONDING"
        echo "✅ Database: ACCESSIBLE"
    else
        echo "⚠️  Search functionality: ISSUE DETECTED"
    fi
else
    echo "❌ Cannot check - backend not running"
fi

echo ""

# System requirements check
echo "⚙️  System Requirements:"
echo "------------------------"

# Check Go
if command -v go &> /dev/null; then
    go_version=$(go version | cut -d' ' -f3)
    echo "✅ Go: $go_version"
else
    echo "❌ Go: NOT INSTALLED"
fi

# Check Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo "✅ Node.js: $node_version"
else
    echo "❌ Node.js: NOT INSTALLED"
fi

# Check npm
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo "✅ npm: $npm_version"
else
    echo "❌ npm: NOT INSTALLED"
fi

echo ""

# Quick actions
echo "🚀 Quick Actions:"
echo "-----------------"
echo "🏃 Start everything:    ./start.sh"
echo "🧪 Run tests:          ./test.sh"
echo "📊 View demo:          ./demo.sh"
echo "📖 Project overview:   ./summary.sh"
echo "🔧 Backend only:       cd backend && go run cmd/main.go"
echo "🎨 Frontend only:      cd frontend && npm run dev"
echo "🐳 Docker stack:       docker-compose up --build"
echo "🔍 Check logs:         docker-compose logs -f"
echo "🛑 Stop Docker:        docker-compose down"

echo ""
echo "💡 Tips:"
echo "--------"
echo "• First time? Run './start.sh' for guided setup"
echo "• Having issues? Check './test.sh' for diagnostics"
echo "• Want to see it in action? Run './demo.sh'"
echo "• Need help? Check README.md for detailed docs"
echo ""
