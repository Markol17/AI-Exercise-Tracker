set -e

echo "🏋️ AI Exercise Tracker"
echo "=================================="

create_env_file() {
    local dir=$1
    if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
        echo "Creating .env file in $dir..."
        cp "$dir/.env.example" "$dir/.env"
        echo "✓ Created .env from .env.example"
    fi
}

echo "📝 Creating .env files from examples..."
create_env_file "apps/server"
create_env_file "apps/perception"
create_env_file "apps/mobile"
create_env_file "packages/db"

echo "📦 Installing Node.js dependencies..."
npm install
cd apps/mobile
npm install
cd ../..

echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "🔄 Pushing database schema to database..."
npm run db:push

echo "🐍 Setting up Python perception environment..."
cd apps/perception

if command -v conda &> /dev/null; then
    echo "Conda detected. Setting up conda environment..."
    eval "$(conda shell.bash hook)"
    
    if conda env list | grep -q "ai-exercise-tracker"; then
        echo "Removing existing 'ai-exercise-tracker' environment..."
        conda env remove -n ai-exercise-tracker -y
    fi
    
    echo "Creating conda environment 'ai-exercise-tracker'..."
    conda env create -f environment.yml
    
    echo "✓ Conda environment 'ai-exercise-tracker' created successfully!"
    echo "  Note: The run script will automatically activate the environment when needed."
else
    echo "⚠️  Conda not found. Using pip to install dependencies..."
    echo "  Creating a virtual environment instead..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    pip install --upgrade pip
    
    echo "Installing Python dependencies from requirements.txt..."
    pip install -r requirements.txt
    
    echo "✓ Virtual environment created and dependencies installed!"
    echo "  Note: The run script will automatically activate the venv when needed."
fi

cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start the server: npm run dev:server"
echo "  2. Start perception: npm run dev:perception"
echo "  3. Start mobile app: npm run dev:mobile"
echo ""
echo "Or run all services: npm run dev"