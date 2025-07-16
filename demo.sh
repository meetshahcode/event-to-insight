#!/bin/bash

# Event-to-Insight System Demonstration Script

set -e

echo "🎯 Event-to-Insight System Demo"
echo "================================"
echo ""

# Check if backend is running
if ! curl -f http://localhost:8080/api/health &> /dev/null; then
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && go run cmd/main.go"
    exit 1
fi

echo "✅ Backend is running"

# Test different query types
declare -a queries=(
    "How do I reset my password?"
    "VPN connection not working"
    "Email setup on iPhone"
    "Printer won't print"
    "Need to install new software"
    "Antivirus blocking my application"
    "Can't access file share"
    "Remote desktop connection failed"
    "How to backup my files"
    "Multi-factor authentication setup"
)

echo ""
echo "🔍 Testing various IT support queries..."
echo ""

for i in "${!queries[@]}"; do
    query="${queries[$i]}"
    echo "📋 Query $((i+1)): \"$query\""
    echo "───────────────────────────────────────"
    
    response=$(curl -s -X POST http://localhost:8080/api/search-query \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")
    
    # Extract summary using jq if available, otherwise use grep/sed
    if command -v jq &> /dev/null; then
        summary=$(echo "$response" | jq -r '.ai_summary_answer')
        article_count=$(echo "$response" | jq '.ai_relevant_articles | length')
        echo "💡 AI Answer: $summary"
        echo "📚 Found $article_count relevant articles"
    else
        echo "📄 Response received (install jq for pretty formatting)"
    fi
    
    echo ""
done

echo "🎉 Demo completed successfully!"
echo ""
echo "🌐 Access the web interface at: http://localhost:3000"
echo "🔧 Backend API health: http://localhost:8080/api/health"
echo ""
echo "📊 System Features Demonstrated:"
echo "   ✅ Natural language query processing"
echo "   ✅ AI-powered answer generation"
echo "   ✅ Knowledge base article matching"
echo "   ✅ Persistent query storage"
echo "   ✅ RESTful API design"
echo "   ✅ Comprehensive error handling"
echo ""
