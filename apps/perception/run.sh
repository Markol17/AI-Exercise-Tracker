#!/bin/bash

# Activate conda environment
eval "$(conda shell.bash hook)"
# Check if the ai-exercise-tracker environment exists
if ! conda env list | grep -q "ai-exercise-tracker"; then
    echo "Conda environment 'ai-exercise-tracker' not found. Creating it from environment.yml..."
    conda env create -f environment.yml
    if [ $? -eq 0 ]; then
        echo "Environment created successfully!"
    else
        echo "Failed to create environment. Exiting."
        exit 1
    fi
fi

# Activate the ai-exercise-tracker environment
echo "Activating ai-exercise-tracker environment..."
conda activate ai-exercise-tracker

# Set environment variables
export WS_URL="ws://192.168.1.103:3001"
# Optional: Pose detection thresholds (defaults to 0.5 if not set)
# export MIN_DETECTION_CONFIDENCE="0.5"
# export MIN_TRACKING_CONFIDENCE="0.5"

echo "Starting Perception App"
echo "WebSocket URL: $WS_URL"
echo ""

python main.py