# Vero Wellness - Computer Vision Fitness Tracking POC

A proof-of-concept system for real-time multi-person fitness tracking using computer vision, featuring exercise recognition, rep counting, and identity enrollment. Built as a TypeScript monorepo with shared packages and type-safe APIs.

## Architecture Overview

```text
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Python         │────▶│  TypeScript  │◀────│  React      │
│  Perception     │     │  Server      │     │  Native App │
│  (MediaPipe)    │     │  (oRPC)      │     │  (Expo)     │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                       │                     │
        │                       ▼                     │
        │                 ┌──────────┐               │
        └────────────────▶│ Postgres │◀──────────────┘
                          └──────────┘

Monorepo Structure:
┌─────────────────────────────────────────────────────────┐
│ TypeScript Workspaces                                   │
├─ apps/                                                  │
│  ├─ server/     # API server (Express + oRPC)          │
│  ├─ mobile/     # React Native app (Expo Router)       │
│  └─ perception/ # Python CV service                    │
├─ packages/                                              │
│  ├─ api/        # Shared oRPC contracts & client       │
│  ├─ db/         # Database schema & migrations         │
│  └─ auth/       # Authentication types                 │
└─────────────────────────────────────────────────────────┘
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

2. **Start services using npm workspaces:**

```bash
# All services at once (recommended for development)
npm run dev

# Or individually:
# Terminal 1: Database
npm run db:up

# Terminal 2: Server
npm run dev:server

# Terminal 3: Perception (requires conda environment)
npm run dev:perception

# Terminal 4: Mobile app
npm run dev:mobile
```

## Project Structure

```text
vero-wellness/
├── apps/
│   ├── server/          # TypeScript API server (Express + oRPC)
│   ├── mobile/          # React Native/Expo mobile app (Expo Router)
│   └── perception/      # Python computer vision service (MediaPipe)
├── packages/
│   ├── api/             # Shared oRPC contracts, client & server setup
│   ├── db/              # Database schema, migrations (Drizzle ORM)
│   └── auth/            # Authentication types and utilities
├── docker-compose.yml   # PostgreSQL database container
├── package.json         # Root workspace configuration
└── setup.sh            # Automated setup script
```

## Development

### TypeScript Monorepo

The project uses npm workspaces for a type-safe development experience:

- **`@vero/api`**: Shared oRPC contracts and type-safe client/server setup
- **`@vero/db`**: Database schema and migrations using Drizzle ORM
- **`@vero/auth`**: Authentication types and utilities
- **`@vero/server`**: Express API server with oRPC endpoints
- **`@vero/mobile`**: React Native app with Expo Router

All packages share TypeScript configurations and import each other without build steps [[memory:6541546]].

**Monorepo Benefits:**

- **Type Safety**: Shared types across client, server, and database layers
- **Hot Reloading**: Changes to shared packages immediately reflect in dependent apps
- **Unified Tooling**: Single npm install, unified scripts, and consistent linting
- **Code Sharing**: Reusable contracts, utilities, and configurations
- **Simplified Deployment**: All TypeScript code builds from a single workspace

### Server API (`apps/server/`)

The server exposes typed procedures via oRPC:

- Member management
- Session lifecycle
- Event ingestion
- Weight recording
- Real-time WebSocket subscriptions

Access the API at `http://localhost:3000/api`

### Perception Service (`apps/perception/`)

The Python computer vision service:

- Captures webcam frames at 30 FPS
- Detects and tracks multiple people using MediaPipe
- Extracts pose keypoints for exercise recognition
- Counts repetitions based on joint angles
- Sends real-time events to the TypeScript server

### Mobile App (`apps/mobile/`)

The React Native app built with Expo Router provides:

- Member creation and management
- Identity enrollment with camera
- Live session monitoring with real-time updates
- Weight entry interface
- Session history and analytics

## Configuration

### Environment Variables

The project uses `.env` files for configuration [[memory:4870235]]:

**Server** (`apps/server/.env`):

```env
DATABASE_URL=postgresql://vero:vero_wellness_2024@localhost:5432/vero_wellness
INGESTION_SECRET=poc_secret_key_2024
PORT=3000
WS_PORT=3001
```

**Perception** (`apps/perception/.env`):

```env
API_BASE_URL=http://localhost:3000/api
WS_URL=ws://localhost:3001
INGESTION_SECRET=poc_secret_key_2024
CAMERA_INDEX=0
```

### Database Management

The project includes convenient npm scripts for database operations:

```bash
# Start/stop PostgreSQL container
npm run db:up
npm run db:down

# Database schema management
npm run db:generate    # Generate migrations from schema changes
npm run db:migrate     # Apply pending migrations
npm run db:push        # Push schema directly to database (dev only)
npm run db:studio      # Open Drizzle Studio web interface
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
- Verify CAMERA_INDEX in `apps/perception/.env`
- Ensure no other applications are using the camera

### Database connection issues

- Ensure Docker is running: `docker ps`
- Start database: `npm run db:up`
- Check container logs: `docker-compose logs postgres`
- Verify credentials in `apps/server/.env`

### Python dependencies

- Activate conda environment: `conda activate vero`
- Reinstall requirements: `pip install -r apps/perception/requirements.txt`
- Recreate environment: `conda env remove -n vero && conda env create -f apps/perception/environment.yml`

### TypeScript workspace issues

- Clean and rebuild: `npm run build`
- Type checking: `npm run type-check`
- Ensure all packages are installed: `npm install`

## Evolution Path

This POC is designed to evolve into a production system with:

- Multi-camera support and calibration
- Hardware sensors (BLE/load cells)
- Expanded exercise catalog
- Advanced temporal models
- Cloud deployment
- Analytics dashboards
