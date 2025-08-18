import requests
import json
import time
from typing import List, Dict, Any, Optional
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self):
        self.base_url = Config.API_BASE_URL
        self.auth_token = Config.INGESTION_SECRET
        self.session_id = None
        self.event_queue = []
        self.last_flush = time.time()
        self.flush_interval = 1.0
        
    def create_session(self, member_id: Optional[str] = None) -> str:
        try:
            response = requests.post(
                f"{self.base_url}/sessions/create",
                json={
                    "memberId": member_id,
                    "metadata": {
                        "source": "perception",
                        "camera": Config.CAMERA_INDEX
                    }
                }
            )
            data = response.json()
            self.session_id = data.get('id')
            logger.info(f"Created session: {self.session_id}")
            return self.session_id
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return None
    
    def end_session(self):
        if not self.session_id:
            return
            
        try:
            self.flush_events()
            response = requests.post(
                f"{self.base_url}/sessions/end",
                json={"sessionId": self.session_id}
            )
            logger.info(f"Ended session: {self.session_id}")
        except Exception as e:
            logger.error(f"Failed to end session: {e}")
    
    def queue_event(self, event_type: str, metadata: Dict[str, Any], 
                    confidence: Optional[float] = None):
        if not self.session_id:
            return
            
        event = {
            "type": event_type,
            "sessionId": self.session_id,
            "timestamp": time.time(),
            "source": "perception",
            "metadata": metadata
        }
        
        if confidence is not None:
            event["confidence"] = confidence
        
        self.event_queue.append(event)
        
        if time.time() - self.last_flush > self.flush_interval:
            self.flush_events()
    
    def flush_events(self):
        if not self.event_queue:
            return
            
        try:
            response = requests.post(
                f"{self.base_url}/events/ingest",
                json={
                    "events": self.event_queue,
                    "authToken": self.auth_token
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Flushed {len(self.event_queue)} events")
                self.event_queue = []
                self.last_flush = time.time()
            else:
                logger.error(f"Failed to flush events: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to flush events: {e}")
    
    def send_person_detected(self, track_id: str, bbox: tuple, confidence: float):
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