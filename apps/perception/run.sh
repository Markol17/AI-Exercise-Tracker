set -e

echo "Starting Perception App..."

if command -v conda &> /dev/null; then
    eval "$(conda shell.bash hook)"
    
    if conda env list | grep -q "ai-exercise-tracker"; then
        echo "✓ Activating conda environment 'ai-exercise-tracker'..."
        conda activate ai-exercise-tracker
        echo "✓ Environment activated"
    else
        echo "❌ Conda environment 'ai-exercise-tracker' not found."
        echo "   Please run the setup script first: ./setup.sh"
        exit 1
    fi
elif [ -d "venv" ]; then
    echo "✓ Activating virtual environment..."
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "❌ No Python environment found (neither conda nor venv)."
    echo "   Please run the setup script first from the project root: ./setup.sh"
    exit 1
fi

echo ""
echo "▶️  Running perception app..."
python main.py