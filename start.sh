#!/bin/bash

# Antystics Quick Start Script
echo "🚀 Starting Antystics..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env file..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env - you may want to customize it"
fi

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Antystics is running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   Swagger: http://localhost:5000/swagger"
    echo ""
    echo "👤 Default admin credentials:"
    echo "   Email: admin@antystyki.pl"
    echo "   Password: Admin123!"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Something went wrong. Check logs with: docker-compose logs"
    exit 1
fi



