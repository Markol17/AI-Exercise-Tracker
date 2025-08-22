#!/usr/bin/env python3
"""
Perception app with WebRTC streaming and WebSocket session control
"""

import asyncio
import json
import logging
import os
import sys
import threading
import time
from typing import Optional

import cv2
import numpy as np
import websockets
from dotenv import load_dotenv

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from ThreadedCamera import ThreadedCamera
from webrtc_streamer import WebRTCStreamer
from exercies import get_exercise_processor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class PerceptionApp:
    def __init__(self):
        self.ws_url = os.getenv("WS_URL", "ws://192.168.1.103:3001")
        self.session_id: Optional[str] = None
        self.exercise_type: Optional[str] = None
        self.member_id: Optional[str] = None
        self.running = False
        self.threaded_camera = None
        self.exercise_processor = None
        self.webrtc_streamer: Optional[WebRTCStreamer] = None
        self.ws = None
        self.loop = None

    async def connect_websocket(self):
        """Connect to WebSocket server"""
        try:
            self.ws = await websockets.connect(self.ws_url)
            logger.info(f"✅ Connected to WebSocket server at {self.ws_url}")

            # Register as perception client immediately (without session)
            await self.ws.send(
                json.dumps(
                    {
                        "type": "register",
                        "role": "perception",
                    }
                )
            )
            logger.info("📱 Registered as perception client (waiting for session)")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to WebSocket: {e}")
            return False

    async def register_as_perception(self):
        """Register as perception client"""
        if self.ws and self.session_id:
            await self.ws.send(
                json.dumps(
                    {
                        "type": "register",
                        "sessionId": self.session_id,
                        "role": "perception",
                    }
                )
            )
            logger.info(f"📱 Registered as perception for session {self.session_id}")

    async def handle_websocket_messages(self):
        """Handle incoming WebSocket messages"""
        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")

    async def handle_message(self, data):
        """Handle specific message types"""
        msg_type = data.get("type")

        if msg_type == "session_start":
            await self.handle_session_start(data)
        elif msg_type == "session_end":
            await self.handle_session_end(data)
        elif msg_type == "webrtc_signaling":
            await self.handle_webrtc_signaling(data)

    async def handle_session_start(self, data):
        """Handle session start message"""
        self.session_id = data.get("sessionId")
        self.exercise_type = data.get("exercise")
        self.member_id = data.get("memberId")

        logger.info(f"🚀 Session started: {self.session_id}")
        logger.info(f"   Exercise: {self.exercise_type}")
        logger.info(f"   Member: {self.member_id}")

        # Register with the new session
        await self.register_as_perception()

        # Start camera and exercise tracking
        await self.start_tracking()

        # Initialize WebRTC streaming
        await self.start_webrtc_streaming()

    async def handle_session_end(self, data):
        """Handle session end message"""
        session_id = data.get("sessionId")

        if session_id == self.session_id:
            logger.info(f"🛑 Ending session: {self.session_id}")
            await self.stop_tracking()

    async def handle_webrtc_signaling(self, data):
        """Forward WebRTC signaling to streamer"""
        if self.webrtc_streamer:
            signaling = data.get("signaling", {})
            await self.webrtc_streamer.handle_signaling(signaling)

    async def start_tracking(self):
        """Start camera and exercise tracking"""
        if self.running:
            logger.warning("Already tracking")
            return

        self.running = True

        # Initialize camera
        camera_index = int(os.getenv("CAMERA_INDEX", 0))
        self.threaded_camera = ThreadedCamera(src=camera_index)
        self.threaded_camera.start()
        logger.info("📹 Camera started")

        # Initialize exercise processor for tracking
        if self.exercise_type:
            self.exercise_processor = get_exercise_processor(self.exercise_type)
            logger.info(f"🏋️ Started {self.exercise_type} tracking")

            # Start sending exercise stats periodically
            asyncio.create_task(self.send_exercise_stats())

    async def start_webrtc_streaming(self):
        """Initialize and start WebRTC streaming"""
        if not self.session_id or not self.threaded_camera:
            logger.warning("Cannot start WebRTC: no session or camera")
            return

        # Check if already streaming
        if self.webrtc_streamer and self.webrtc_streamer.streaming:
            logger.warning("WebRTC already streaming for this session")
            return

        # Clean up any existing streamer
        if self.webrtc_streamer:
            await self.webrtc_streamer.disconnect()
            self.webrtc_streamer = None

        # Create WebRTC streamer with exercise processor
        self.webrtc_streamer = WebRTCStreamer(
            ws_url=self.ws_url,
            session_id=self.session_id,
            exercise_processor=self.exercise_processor,
        )

        # Connect and register
        if await self.webrtc_streamer.connect():
            # Start listening for signaling
            asyncio.create_task(self.webrtc_streamer.listen_for_signaling())

            # Start streaming video
            await self.webrtc_streamer.start_streaming(self.threaded_camera)
            logger.info("🎥 WebRTC streaming started")

    async def stop_tracking(self):
        """Stop camera and exercise tracking"""
        self.running = False
        logger.info("📹 Stopping tracking...")

        # Stop WebRTC streaming first
        try:
            if self.webrtc_streamer:
                await self.webrtc_streamer.stop_streaming()
                await asyncio.sleep(0.1)  # Small delay to ensure streaming stops
                await self.webrtc_streamer.disconnect()
                self.webrtc_streamer = None
                logger.info("✅ WebRTC streaming stopped")
        except Exception as e:
            logger.error(f"Error stopping WebRTC: {e}")
            self.webrtc_streamer = None

        # Small delay before cleaning up processor
        await asyncio.sleep(0.1)

        # Clean up exercise processor before stopping camera
        try:
            if self.exercise_processor:
                self.exercise_processor.cleanup()
                self.exercise_processor = None
                logger.info("✅ Exercise processor cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up exercise processor: {e}")
            self.exercise_processor = None

        # Small delay before stopping camera
        await asyncio.sleep(0.1)

        # Stop camera last
        try:
            if self.threaded_camera:
                self.threaded_camera.stop()
                self.threaded_camera = None
                logger.info("✅ Camera stopped")
        except Exception as e:
            logger.error(f"Error stopping camera: {e}")
            self.threaded_camera = None

        # Reset session info
        self.session_id = None
        self.exercise_type = None
        self.member_id = None

        logger.info("📹 Tracking stopped successfully")

    async def send_exercise_stats(self):
        """Send exercise stats periodically to mobile app"""
        while self.running and self.ws:
            try:
                if self.exercise_processor:
                    # Get current stats from processor
                    base_stats = self.exercise_processor.get_stats()
                    
                    # Add any additional stats that might be present
                    stats = {
                        "exercise": self.exercise_type,
                        "rep_count": base_stats.get("rep_count", 0),
                        "plank_duration": getattr(self.exercise_processor, "plank_duration", 0),
                        "shoulder_tap_count": getattr(self.exercise_processor, "shoulder_tap_count", 0),
                    }

                    # Send stats to mobile app
                    await self.ws.send(
                        json.dumps(
                            {
                                "type": "exercise_stats",
                                "sessionId": self.session_id,
                                "stats": stats,
                                "timestamp": time.time(),
                            }
                        )
                    )

                # Send stats every 500ms for responsive UI
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Error sending exercise stats: {e}")
                break

    async def run(self):
        """Main run loop"""
        # Connect to WebSocket
        if not await self.connect_websocket():
            return

        try:
            # Handle messages until disconnected
            await self.handle_websocket_messages()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            await self.cleanup()

    async def cleanup(self):
        """Clean up resources"""
        await self.stop_tracking()

        if self.ws:
            await self.ws.close()

        logger.info("✅ Cleanup complete")


def main():
    """Main entry point"""
    app = PerceptionApp()

    # Run the async app
    try:
        asyncio.run(app.run())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
