import requests
import json
import time
import websocket
import threading
from typing import List, Dict, Any, Optional
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self):
        self.base_url = Config.API_BASE_URL  # http://localhost:3000/rpc
        self.ws_url = Config.WS_URL
        self.auth_token = Config.INGESTION_SECRET
        self.session_id = None
        self.event_queue = []
        self.last_flush = time.time()
        self.flush_interval = 1.0
        self.ws = None
        self.ws_thread = None
        self.ws_connected = False
        self.tracked_persons = set()  # Track which persons we've detected
        
    def connect_websocket(self):
        """Connect to WebSocket server for real-time updates"""
        try:
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    if data.get('type') == 'connected':
                        logger.info(f"WebSocket connected with client ID: {data.get('clientId')}")
                        self.ws_connected = True
                        # Subscribe to session updates if we have a session
                        if self.session_id:
                            self.ws.send(json.dumps({
                                'type': 'subscribe',
                                'sessionId': self.session_id
                            }))
                    elif data.get('type') == 'subscribed':
                        logger.info(f"Subscribed to session: {data.get('sessionId')}")
                except Exception as e:
                    logger.error(f"Error processing WebSocket message: {e}")
            
            def on_error(ws, error):
                logger.error(f"WebSocket error: {error}")
                self.ws_connected = False
            
            def on_close(ws, close_status_code, close_msg):
                logger.info("WebSocket connection closed")
                self.ws_connected = False
            
            def on_open(ws):
                logger.info("WebSocket connection opened")
                self.ws_connected = True
            
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
                on_open=on_open
            )
            
            # Run WebSocket in a separate thread
            self.ws_thread = threading.Thread(target=self.ws.run_forever)
            self.ws_thread.daemon = True
            self.ws_thread.start()
            
        except Exception as e:
            logger.error(f"Failed to connect WebSocket: {e}")
    
    def disconnect_websocket(self):
        """Disconnect WebSocket"""
        if self.ws:
            self.ws.close()
            if self.ws_thread:
                self.ws_thread.join(timeout=2)
    
    def _call_api(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to make API calls"""
        try:
            # Use the API endpoints which accept direct JSON bodies
            base_api_url = self.base_url.replace('/rpc', '/api')
            response = requests.post(
                f"{base_api_url}/{endpoint}",
                headers={
                    'Content-Type': 'application/json'
                },
                json=data
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"API call failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"API call error: {e}")
            return None
        
    def create_session(self, member_id: Optional[str] = None) -> str:
        try:
            # Call sessions/create API endpoint
            data = {
                "metadata": {
                    "source": "perception",
                    "camera": str(Config.CAMERA_INDEX)
                }
            }
            # Only include memberId if it's provided
            if member_id:
                data["memberId"] = member_id
            
            result = self._call_api("sessions/create", data)
            
            if result:
                self.session_id = result.get('id')
                logger.info(f"Created session: {self.session_id}")
                
                # Connect to WebSocket after creating session
                self.connect_websocket()
                
                # Wait a bit for WebSocket to connect
                time.sleep(0.5)
                
                # Subscribe to session updates
                if self.ws and self.ws_connected and self.session_id:
                    self.ws.send(json.dumps({
                        'type': 'subscribe',
                        'sessionId': self.session_id
                    }))
                
                return self.session_id
            else:
                logger.error("Failed to create session")
                return None
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return None
    
    def end_session(self):
        if not self.session_id:
            return
            
        try:
            # Flush any remaining events
            self.flush_events()
            
            # Send person_lost events for all tracked persons
            for track_id in list(self.tracked_persons):
                self.send_person_lost(track_id)
            self.flush_events()
            
            # End the session
            result = self._call_api("sessions/end", {
                "sessionId": self.session_id
            })
            
            if result:
                logger.info(f"Ended session: {self.session_id}")
            else:
                logger.error("Failed to end session")
            
            # Disconnect WebSocket
            self.disconnect_websocket()
            
        except Exception as e:
            logger.error(f"Failed to end session: {e}")
    
    def queue_event(self, event_type: str, metadata: Dict[str, Any], 
                    confidence: Optional[float] = None):
        if not self.session_id:
            return
            
        event = {
            "type": event_type,
            "sessionId": self.session_id,
            # Timestamp will be set by server
            "source": "perception",
            "metadata": metadata
        }
        
        if confidence is not None:
            event["confidence"] = confidence
        
        self.event_queue.append(event)
        
        # Auto-flush if interval has passed or queue is getting large
        if (time.time() - self.last_flush > self.flush_interval) or len(self.event_queue) >= 10:
            self.flush_events()
    
    def flush_events(self):
        if not self.event_queue:
            return
            
        try:
            # Use events/ingest API endpoint
            result = self._call_api("events/ingest", {
                "events": self.event_queue,
                "authToken": self.auth_token
            })
            
            if result and result.get('success'):
                logger.info(f"Flushed {len(self.event_queue)} events successfully")
                self.event_queue = []
                self.last_flush = time.time()
            else:
                logger.error(f"Failed to flush events: {result}")
        except Exception as e:
            logger.error(f"Failed to flush events: {e}")
    
    def send_person_detected(self, track_id: str, bbox: tuple, confidence: float):
        # Track this person
        self.tracked_persons.add(track_id)
        
        self.queue_event("person_detected", {
            "trackId": track_id,
            "boundingBox": {
                "x": bbox[0],
                "y": bbox[1],
                "width": bbox[2] - bbox[0],
                "height": bbox[3] - bbox[1]
            }
        }, confidence)
    
    def send_person_lost(self, track_id: str):
        # Remove from tracked persons
        self.tracked_persons.discard(track_id)
        
        self.queue_event("person_lost", {
            "trackId": track_id
        })
    
    def send_exercise_started(self, track_id: str, exercise: str, set_number: int):
        self.queue_event("exercise_started", {
            "trackId": track_id,
            "exercise": exercise,
            "setNumber": set_number
        })
    
    def send_rep_completed(self, track_id: str, exercise: str, 
                           rep_number: int, set_number: int):
        self.queue_event("rep_completed", {
            "trackId": track_id,
            "exercise": exercise,
            "repNumber": rep_number,
            "setNumber": set_number
        })
    
    def send_identity_matched(self, track_id: str, member_id: str, confidence: float):
        self.queue_event("identity_matched", {
            "trackId": track_id,
            "memberId": member_id
        }, confidence)
    
    def record_weight(self, member_id: str, exercise: str, weight: float, 
                     unit: str = 'lbs', set_number: int = 1):
        """Record weight for a member's exercise set"""
        if not self.session_id:
            return
        
        try:
            result = self._call_api("weights/record", {
                "sessionId": self.session_id,
                "memberId": member_id,
                "exercise": exercise,
                "setNumber": set_number,
                "weight": weight,
                "unit": unit,
                "source": "vision",
                "confidence": 0.5  # Low confidence for vision-based weight detection
            })
            
            if result:
                logger.info(f"Recorded weight: {weight}{unit} for {exercise}")
            else:
                logger.error("Failed to record weight")
        except Exception as e:
            logger.error(f"Failed to record weight: {e}")