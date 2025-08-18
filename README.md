# Vero Wellness - Computer Vision Fitness Tracking POC

A proof-of-concept system for real-time multi-person fitness tracking using computer vision, featuring exercise recognition, rep counting, and identity enrollment.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Python         │────▶│  TypeScript  │◀────│  React      │
│  Perception     │     │  Server      │     │  Native App │
│  (OpenCV/YOLO)  │     │  (oRPC)      │     │  (Expo)     │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                       │                     │
        │                       ▼                     │
        │                 ┌──────────┐               │
        └────────────────▶│ Postgres │◀──────────────┘
                          └──────────┘
```

## Features

- **Multi-person tracking**: Simultaneous tracking of multiple people in frame
- **Pose estimation**: Real-time skeletal keypoint detection
- **Exercise recognition**: Automatic detection of squats and bicep curls
- **Rep counting**: Accurate repetition counting based on joint angles
- **Identity enrollment**: Optional face recognition for member identification
- **Weight tracking**: Manual weight entry via mobile app
- **Real-time updates**: WebSocket-based live event streaming
- **Type safety**: End-to-end type safety with oRPC and shared contracts

## Prerequisites

- macOS with Apple Silicon (M3)
- Node.js 18+
- Python 3.11
- Anaconda/Miniconda
- Docker Desktop
- Webcam access

## Quick Start

1. **Clone and setup:**
```bash
chmod +x setup.sh
./setup.sh
```

2. **Start services:**
```bash
# Terminal 1: Database
docker-compose up postgres

# Terminal 2: Server
cd server
npm run dev

# Terminal 3: Perception (requires conda)
cd perception
conda activate vero
python main.py

# Terminal 4: Mobile app
cd mobile
npm start
```

## Project Structure

```
vero-wellness/
├── server/          # TypeScript API server (oRPC + Drizzle)
├── perception/      # Python computer vision service
├── mobile/          # React Native/Expo mobile app
├── shared/          # Shared TypeScript types and contracts
└── docker-compose.yml
```

## Development

### Server API

The server exposes typed procedures via oRPC:
- Member management
- Session lifecycle
- Event ingestion
- Weight recording
- Real-time WebSocket subscriptions

Access the API at `http://localhost:3000/api`

### Perception Service

The perception service:
- Captures webcam frames at 30 FPS
- Detects and tracks multiple people
- Extracts pose keypoints using MediaPipe
- Recognizes exercises and counts reps
- Sends events to the server API

### Mobile App

The React Native app provides:
- Member creation and management
- Identity enrollment with camera
- Live session monitoring
- Weight entry interface
- Session history

## Configuration

### Environment Variables

**Server** (`server/.env`):
```
DATABASE_URL=postgresql://vero:vero_wellness_2024@localhost:5432/vero_wellness
INGESTION_SECRET=poc_secret_key_2024
PORT=3000
WS_PORT=3001
```

**Perception** (`perception/.env`):
```
API_BASE_URL=http://localhost:3000/api
WS_URL=ws://localhost:3001
INGESTION_SECRET=poc_secret_key_2024
CAMERA_INDEX=0
```

## Testing the System

1. Start all services
2. Open the mobile app on your device/simulator
3. Create a member
4. Start a new session
5. Stand in front of the webcam
6. Perform squats or bicep curls
7. Watch real-time rep counting in the app
8. Add weights after completing sets

## Troubleshooting

### Camera not working
- Check camera permissions in System Preferences
- Verify CAMERA_INDEX in perception/.env

### Database connection issues
- Ensure Docker is running
- Check postgres container: `docker ps`
- Verify credentials in server/.env

### Python dependencies
- Activate conda environment: `conda activate vero`
- Reinstall requirements: `pip install -r requirements.txt`

## Evolution Path

This POC is designed to evolve into a production system with:
- Multi-camera support and calibration
- Hardware sensors (BLE/load cells)
- Expanded exercise catalog
- Advanced temporal models
- Cloud deployment
- Analytics dashboards

## License

Proprietary - Vero Wellness 2024