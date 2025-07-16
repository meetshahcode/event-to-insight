#!/bin/bash

# Event-to-Insight System Quick Start Script

set -e

echo "🚀 Setting up Event-to-Insight System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create necessary directories
echo "📁 Creating data directory..."
mkdir -p data

# Start the services
echo "🐳 Starting services with Docker Compose..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check backend health
echo "🔍 Checking backend health..."
for i in {1..10}; do
    if curl -f http://localhost:8080/api/health &> /dev/null; then
        echo "✅ Backend is healthy"
        break
    fi
    echo "⏳ Waiting for backend... (attempt $i/10)"
    sleep 3
done

# Check frontend
echo "🔍 Checking frontend..."
for i in {1..10}; do
    if curl -f http://localhost:3000 &> /dev/null; then
        echo "✅ Frontend is available"
        break
    fi
    echo "⏳ Waiting for frontend... (attempt $i/10)"
    sleep 3
done

echo ""
echo "🎉 Event-to-Insight System is ready!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080/api/health"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "💡 Try asking questions like:"
echo "   - How do I reset my password?"
echo "   - VPN setup instructions"
echo "   - Email configuration help"
echo ""
