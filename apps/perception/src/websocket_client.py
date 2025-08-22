import json
import threading
import time
from typing import Optional

import websocket


class ExerciseWebSocketClient:
    def __init__(self, ws_url: str = "ws://192.168.1.103:3001"):
        self.ws_url = ws_url
        self.ws: Optional[websocket.WebSocket] = None
        self.connected = False
        self.reconnect_delay = 5

    def connect(self):
        """Connect to WebSocket server"""
        try:
            self.ws = websocket.create_connection(self.ws_url)
            self.connected = True
            print(f"✅ Connected to WebSocket server at {self.ws_url}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to WebSocket server: {e}")
            self.connected = False
            return False

    def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.ws:
            try:
                self.ws.close()
                print("📱 Disconnected from WebSocket server")
            except Exception as e:
                print(f"❌ Error disconnecting: {e}")
        self.connected = False

    def send_exercise_data(self, exercise_type: str, data: dict):
        """Send exercise data to WebSocket server"""
        if not self.connected or not self.ws:
            if not self.connect():
                return False

        try:
            message = {
                "type": "exercise_stats",
                "exercise": exercise_type,
                "data": data,
                "timestamp": time.time(),
            }

            self.ws.send(json.dumps(message))
            return True

        except Exception as e:
            print(f"❌ Failed to send exercise data: {e}")
            self.connected = False
            return False

    def send_rep_count(self, exercise_type: str, count: int):
        """Send rep count for exercises like pushups, squats, etc."""
        return self.send_exercise_data(
            exercise_type, {"type": "rep_count", "count": count}
        )

    def send_plank_duration(self, duration: float):
        """Send plank duration in seconds"""
        return self.send_exercise_data(
            "plank", {"type": "duration", "duration": duration}
        )

    def send_shoulder_tap_count(self, count: int):
        """Send shoulder tap count"""
        return self.send_exercise_data(
            "shouldertap", {"type": "tap_count", "count": count}
        )


# Global WebSocket client instance
ws_client = ExerciseWebSocketClient()
