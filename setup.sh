#!/bin/bash

echo "🏋️ Vero Wellness POC Setup"
echo "=========================="

echo "📦 Installing Node.js dependencies..."
npm install

echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "🔄 Running database migrations..."
cd server
npm run db:generate
npm run db:migrate
cd ..

echo "🐍 Setting up Python environment..."
cd perception
echo "Creating conda environment..."
conda env create -f environment.yml
echo "Activating environment..."
conda activate vero
echo "Installing additional Python dependencies..."
pip install -r requirements.txt
cd ..

echo "📱 Setting up mobile app..."
cd mobile
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start the server: npm run dev:server"
echo "  2. Start perception: npm run dev:perception"
echo "  3. Start mobile app: npm run dev:mobile"
echo ""
echo "Or run all services: npm run dev"