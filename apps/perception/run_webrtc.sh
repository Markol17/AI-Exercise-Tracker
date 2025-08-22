#!/bin/bash

# Activate conda environment
eval "$(conda shell.bash hook)"
# Check if the vero-perception environment exists
if ! conda env list | grep -q "vero-perception"; then
    echo "Conda environment 'vero-perception' not found. Creating it from environment.yml..."
    conda env create -f environment.yml
    if [ $? -eq 0 ]; then
        echo "Environment created successfully!"
    else
        echo "Failed to create environment. Exiting."
        exit 1
    fi
fi

# Activate the vero-perception environment
echo "Activating vero-perception environment..."
conda activate vero-perception

# Set environment variables
export WS_URL="ws://192.168.1.103:3001"
export CAMERA_INDEX="0"

# Optional: Pose detection thresholds (defaults to 0.5 if not set)
# export MIN_DETECTION_CONFIDENCE="0.5"
# export MIN_TRACKING_CONFIDENCE="0.5"

echo "🚀 Starting Perception App with WebRTC"
echo "   WebSocket URL: $WS_URL"
echo "   Camera Index: $CAMERA_INDEX"
echo ""

# Run the perception app (no parameters needed)
python perception_webrtc.py