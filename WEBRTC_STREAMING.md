# Real-Time Video Streaming with WebRTC

This document explains how to use the real-time video streaming functionality that connects the perception app with the mobile app using WebRTC for ultra-low latency.

## Overview

The video streaming implementation provides:

- **Sub-100ms latency** using WebRTC peer-to-peer connections
- **Session-scoped streaming** - each session gets its own dedicated video stream
- **Automatic connection management** with reconnection handling
- **Real-time exercise tracking** overlaid on the video stream
- **Fallback options** for reliability

## Architecture

```
┌─────────────────┐    WebRTC P2P     ┌─────────────────┐
│  Perception App │ ◄─────────────► │   Mobile App    │
│   (Python)      │                  │ (React Native)  │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │         WebSocket Signaling        │
         └─────────────┐         ┌─────────────┘
                       │         │
                ┌─────────────────┐
                │  Server/API     │
                │ (WebSocket)     │
                └─────────────────┘
```

## Quick Start

### 1. Start the Server (if not already running)

```bash
# From project root
npm run dev:server
```

### 2. Start Perception App with WebRTC

```bash
# Navigate to perception app
cd apps/perception

# Easy way - use the convenience script
python start_webrtc_session.py pushup

# Or manually with custom session ID
python main.py --type pushup --session-id my-session-123 --enable-webrtc
```

### 3. Start Mobile App

```bash
# Navigate to mobile app
cd apps/mobile

# Start mobile app
npm start
```

### 4. Start Live Session in Mobile App

1. Open the mobile app
2. Navigate to the Members tab
3. Select a member and start a live session
4. The video stream should automatically connect and display the camera feed

## Session Management

### Session IDs

Each streaming session requires a unique session ID to associate the video stream with the correct mobile session:

- **Auto-generated**: If you don't specify a session ID, one is automatically created
- **Manual**: You can specify a custom session ID using `--session-id`
- **Format**: `session-YYYYMMDD-HHMMSS-UUID` (e.g., `session-20241220-143052-a1b2c3d4`)

### Session Lifecycle

1. **Mobile app starts session** → Generates session ID and registers with server
2. **Perception app starts with session ID** → Registers as video source for that session
3. **WebRTC handshake** → Mobile app and perception app establish peer-to-peer connection
4. **Video streaming** → Live camera feed with pose detection overlay
5. **Session ends** → Both apps clean up connections

## Perception App Usage

### Basic Commands

```bash
# Start with WebRTC enabled (auto-generated session ID)
python main.py --type pushup --enable-webrtc

# Start with specific session ID
python main.py --type squat --session-id session-abc123 --enable-webrtc

# Interactive mode with WebRTC
python main.py --enable-webrtc

# Traditional mode without WebRTC
python main.py --type pushup
```

### Convenience Script

The `start_webrtc_session.py` script provides an easier interface:

```bash
# Quick start with auto-generated session ID
python start_webrtc_session.py pushup

# Custom session ID
python start_webrtc_session.py squat --session-id my-custom-session

# Interactive mode
python start_webrtc_session.py

# Disable WebRTC (for testing)
python start_webrtc_session.py pushup --no-webrtc
```

## Mobile App Integration

The mobile app automatically handles WebRTC connections:

### Features

- **Auto-connection**: Automatically attempts to connect to video stream when session starts
- **Connection status**: Real-time indicators showing WebRTC connection state
- **Retry mechanism**: Manual retry button if connection fails
- **Session info**: Displays current session ID for debugging
- **Graceful fallback**: Shows placeholder if video unavailable

### UI Elements

- **Video Stream**: Full-screen video feed from perception app
- **Connection Status**: Green/red indicator for WebRTC state
- **Session ID**: Displayed for troubleshooting
- **Retry Button**: Manual reconnection option
- **Exercise Stats**: Real-time rep counting overlaid on video

## Network Requirements

### Ports

- **WebSocket Signaling**: Port 3001 (configurable)
- **WebRTC**: Uses dynamic ports for peer-to-peer connection

### Firewall

- Ensure both devices can reach each other on the local network
- WebRTC typically works well on local networks without special configuration
- For remote connections, STUN/TURN servers may be needed

### Network Performance

- **Minimum**: 1 Mbps for basic video quality
- **Recommended**: 5+ Mbps for high-quality streaming
- **Latency**: Best with <50ms network latency between devices

## Troubleshooting

### Common Issues

1. **Video not appearing**

   - Check that both apps are using the same session ID
   - Verify WebSocket connection is established
   - Try the retry button in mobile app

2. **High latency or choppy video**

   - Check network bandwidth and latency
   - Ensure devices are on the same local network
   - Close other bandwidth-intensive applications

3. **Connection fails**

   - Verify server is running on port 3001
   - Check firewall settings
   - Ensure both apps can reach the server

4. **Session ID mismatch**
   - Mobile app auto-generates session IDs
   - Perception app must use matching session ID
   - Check console logs for session ID information

### Debug Information

#### Perception App Logs

```
✅ Connected to signaling server at ws://localhost:3001
📱 Registered as perception client for session session-abc123
🎥 Started WebRTC video streaming
📡 Sent offer signaling
✅ Set remote description from mobile answer
```

#### Mobile App Logs

```
📱 Registered as mobile client for session session-abc123
🎥 Perception app connected, ready for WebRTC
📨 Received offer signaling
📡 Sent answer signaling
✅ WebRTC connection established
📺 Received remote video track
```

#### Server Logs

```
📱 Client abc123 connected
📱 Client abc123 registered as mobile for session session-abc123
📱 Client def456 registered as perception for session session-abc123
🔄 WebRTC signaling from def456 (perception) to mobile in session session-abc123
```

## Advanced Configuration

### WebRTC Settings

The system is optimized for local network deployment with minimal configuration:

```javascript
const pcConfig = {
	// No ICE servers needed for local network connections
	iceServers: [],
};
```

This simplified configuration is perfect for local networks because:

- **Faster connection setup** - No external STUN server queries
- **Lower latency** - Direct peer-to-peer connection
- **No external dependencies** - Works offline
- **Privacy-friendly** - No data sent to external servers

### Video Quality

The perception app streams at 30fps with adaptive quality based on network conditions. To modify:

1. Edit `apps/perception/src/webrtc_streamer.py`
2. Adjust the `OpenCVVideoTrack` frame rate and resolution
3. Modify WebRTC encoder settings if needed

### When You Might Need ICE Servers

The current configuration works perfectly for local networks, but you might need ICE servers if:

**Add STUN servers for:**

- Devices on different subnets
- Complex network configurations with multiple NAT layers
- Testing connectivity issues

**Add TURN servers for:**

- Remote access over the internet
- Corporate firewalls blocking direct connections
- Production deployments with complex network topology

**Example with ICE servers:**

```javascript
// Mobile app (useWebRTCVideoStream.ts)
const pcConfig = useMemo(
	() => ({
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{
				urls: 'turn:your-turn-server.com:3478',
				username: 'user',
				credential: 'pass',
			},
		],
	}),
	[]
);
```

```python
# Perception app (webrtc_streamer.py)
from aiortc import RTCConfiguration, RTCIceServer

configuration = RTCConfiguration([
	RTCIceServer("stun:stun.l.google.com:19302"),
	RTCIceServer("turn:your-turn-server.com:3478", username="user", credential="pass")
])
self.pc = RTCPeerConnection(configuration)
```

## API Reference

### Perception App

```python
# Configure exercise with WebRTC
exercise = Pushup()
exercise.set_session_config(
    session_id="session-abc123",
    enable_webrtc=True
)
await exercise.exercise_async()
```

### Mobile App

```typescript
// WebRTC hook usage
const { remoteStream, connectionState, isStreaming, startVideoStream, stopVideoStream } = useWebRTCVideoStream({
	sessionId: 'session-abc123',
	webSocket: getWebSocket(),
	connectionStatus: readyState,
	sendMessage,
});
```

## Performance Optimization

### Best Practices

1. **Use local network**: Keep both devices on the same WiFi for best performance
2. **Close unnecessary apps**: Free up CPU and network resources
3. **Adequate lighting**: Ensure good lighting for camera and pose detection
4. **Stable positioning**: Mount or position camera to avoid excessive movement

### Monitoring

- Watch connection state indicators in mobile app
- Monitor console logs for performance warnings
- Check network usage if experiencing issues

## Future Enhancements

Planned improvements include:

- **Adaptive bitrate streaming**: Automatic quality adjustment based on network conditions
- **Multi-camera support**: Support for multiple camera angles
- **Recording capabilities**: Save video sessions for later review
- **Cloud deployment**: Support for remote streaming over internet
- **Enhanced pose visualization**: More detailed pose detection overlays

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review console logs from both apps
3. Verify network connectivity between devices
4. Ensure all dependencies are installed correctly

The implementation provides a robust foundation for real-time video streaming with excellent performance characteristics for local network deployment.
