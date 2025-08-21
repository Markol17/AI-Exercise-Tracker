#!/bin/bash

# Initialize conda for this script
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

# Run the main Python script
python main.py
