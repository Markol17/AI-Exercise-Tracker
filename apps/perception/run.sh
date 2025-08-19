#!/bin/bash

# Initialize conda for this script
eval "$(conda shell.bash hook)"

# Activate the vero environment
conda activate vero

# Run the main Python script
python main.py
