import asyncio
import fractions
import json
import logging
import time
from typing import Optional

import cv2
import numpy as np
import websockets
from aiortc import (
    RTCConfiguration,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    VideoStreamTrack,
)
from aiortc.contrib.media import MediaPlayer
from av import VideoFrame

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenCVVideoTrack(VideoStreamTrack):
    """Custom video track that streams OpenCV frames via WebRTC"""

    def __init__(self, threaded_camera, exercise_processor=None):
        super().__init__()
        self.threaded_camera = threaded_camera
        self.exercise_processor = exercise_processor
        self.frame_count = 0
        self.start_time = time.time()

    async def recv(self):
        """Generate video frames for WebRTC transmission"""
        # Calculate target timestamp for 30fps
        pts = int((time.time() - self.start_time) * 90000)  # 90kHz clock

        # Get frame from threaded camera
        success, frame = self.threaded_camera.show_frame()

        if not success or frame is None:
            # Return black frame if no camera data
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
        else:
            # Process frame with exercise tracking if processor is available
            if self.exercise_processor:
                try:
                    frame, stats = self.exercise_processor.process_frame(frame)
                    # Stats could be sent via WebSocket if needed
                except Exception as e:
                    logger.error(f"Error processing frame: {e}")

        # Ensure frame is in the right format (RGB)
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            # Convert BGR to RGB for WebRTC
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Create VideoFrame
        av_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        av_frame.pts = pts
        av_frame.time_base = fractions.Fraction(1, 90000)  # Use Fraction for time_base

        self.frame_count += 1
        return av_frame


class WebRTCStreamer:
    """WebRTC video streamer for perception app"""

    def __init__(self, ws_url: str = "ws://192.168.1.103:3001", session_id: str = None, exercise_processor=None):
        self.ws_url = ws_url
        self.session_id = session_id
        self.exercise_processor = exercise_processor
        self.ws = None
        self.pc = None
        self.video_track = None
        self.connected = False
        self.streaming = False

    async def connect(self):
        """Connect to WebSocket signaling server"""
        try:
            self.ws = await websockets.connect(self.ws_url)
            self.connected = True
            logger.info(f"✅ Connected to signaling server at {self.ws_url}")

            # Register as perception client for the session
            if self.session_id:
                await self.register_client()

            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to signaling server: {e}")
            self.connected = False
            return False

    async def register_client(self):
        """Register this client as a perception device for the session"""
        register_message = {
            "type": "register",
            "sessionId": self.session_id,
            "role": "perception",
        }
        await self.send_message(register_message)
        logger.info(f"📱 Registered as perception client for session {self.session_id}")

    async def send_message(self, message):
        """Send message via WebSocket"""
        if self.ws and self.connected:
            await self.ws.send(json.dumps(message))

    async def start_streaming(self, threaded_camera):
        """Start WebRTC video streaming"""
        if self.streaming:
            logger.warning("Already streaming")
            return

        try:
            # Create peer connection - configured for local network use
            configuration = RTCConfiguration([])  # No ICE servers for local connections
            self.pc = RTCPeerConnection(configuration)

            # Create video track from camera with exercise processor
            self.video_track = OpenCVVideoTrack(threaded_camera, self.exercise_processor)
            self.pc.addTrack(self.video_track)
            logger.info(f"📹 Added video track to peer connection")

            # Set up ICE candidate handling
            @self.pc.on("icecandidate")
            async def on_icecandidate(candidate):
                if candidate:
                    await self.send_signaling(
                        "ice-candidate",
                        {
                            "candidate": candidate.candidate,
                            "sdpMid": candidate.sdpMid,
                            "sdpMLineIndex": candidate.sdpMLineIndex,
                        },
                    )

            # Create offer
            offer = await self.pc.createOffer()
            await self.pc.setLocalDescription(offer)

            # Send offer to mobile app
            await self.send_signaling("offer", {"type": offer.type, "sdp": offer.sdp})

            self.streaming = True
            logger.info("🎥 Started WebRTC video streaming")

        except Exception as e:
            logger.error(f"❌ Failed to start streaming: {e}")
            self.streaming = False

    async def send_signaling(self, signal_type: str, data: dict):
        """Send WebRTC signaling message"""
        message = {
            "type": "webrtc_signaling",
            "targetRole": "mobile",
            "signaling": {"type": signal_type, "data": data},
        }
        await self.send_message(message)
        logger.info(f"📡 Sent {signal_type} signaling")

    async def handle_signaling(self, signaling):
        """Handle incoming WebRTC signaling messages"""
        signal_type = signaling.get("type")
        data = signaling.get("data", {})

        logger.info(f"📨 Received {signal_type} signaling")

        if signal_type == "answer":
            # Handle answer from mobile app
            answer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
            await self.pc.setRemoteDescription(answer)
            logger.info("✅ Set remote description from mobile answer")

        elif signal_type == "ice-candidate":
            # Handle ICE candidate from mobile app
            if data.get("candidate"):
                try:
                    # aiortc expects the candidate to be parsed from the candidate string
                    from aiortc import RTCIceCandidate as IceCandidate
                    from aiortc.sdp import candidate_from_sdp
                    
                    # Parse the candidate string
                    ice_candidate = candidate_from_sdp(data.get("candidate"))
                    ice_candidate.sdpMid = data.get("sdpMid")
                    ice_candidate.sdpMLineIndex = data.get("sdpMLineIndex")
                    
                    await self.pc.addIceCandidate(ice_candidate)
                    logger.info("🧊 Added ICE candidate from mobile")
                except Exception as e:
                    logger.error(f"Failed to add ICE candidate: {e}")
            else:
                logger.info("📭 Received end-of-candidates signal")

    async def listen_for_signaling(self):
        """Listen for WebRTC signaling messages"""
        while self.connected:
            try:
                message = await self.ws.recv()
                data = json.loads(message)

                if (
                    data.get("type") == "webrtc_signaling"
                    and data.get("fromRole") == "mobile"
                ):
                    await self.handle_signaling(data.get("signaling", {}))

            except websockets.exceptions.ConnectionClosed:
                logger.info("WebSocket connection closed")
                self.connected = False
                break
            except Exception as e:
                logger.error(f"Error handling signaling message: {e}")

    async def stop_streaming(self):
        """Stop WebRTC streaming"""
        self.streaming = False

        if self.pc:
            try:
                await self.pc.close()
            except Exception as e:
                logger.error(f"Error closing peer connection: {e}")
            self.pc = None

        if self.video_track:
            self.video_track = None

        logger.info("🛑 Stopped WebRTC streaming")

    async def disconnect(self):
        """Disconnect from signaling server"""
        await self.stop_streaming()

        if self.ws:
            await self.ws.close()
            self.ws = None

        self.connected = False
        logger.info("📱 Disconnected from signaling server")


# Global WebRTC streamer instance
webrtc_streamer: Optional[WebRTCStreamer] = None


async def init_webrtc_streaming(session_id: str, threaded_camera):
    """Initialize WebRTC streaming for a session"""
    global webrtc_streamer

    if webrtc_streamer:
        await webrtc_streamer.disconnect()

    webrtc_streamer = WebRTCStreamer(session_id=session_id)

    if await webrtc_streamer.connect():
        # Start listening for signaling in background
        asyncio.create_task(webrtc_streamer.listen_for_signaling())

        # Start streaming
        await webrtc_streamer.start_streaming(threaded_camera)

        return webrtc_streamer

    return None


async def cleanup_webrtc_streaming():
    """Clean up WebRTC streaming"""
    global webrtc_streamer

    if webrtc_streamer:
        await webrtc_streamer.disconnect()
        webrtc_streamer = None
