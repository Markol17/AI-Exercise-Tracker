import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import time
import logging
from typing import Dict, List, Tuple, Optional
import signal
import sys

from config import Config
from tracker import MultiPersonTracker
from exercise_detector import ExerciseDetector
from api_client import APIClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerceptionService:
    def __init__(self):
        logger.info("Initializing Perception Service...")
        
        self.yolo = YOLO(Config.YOLO_MODEL)
        
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.tracker = MultiPersonTracker()
        self.exercise_detector = ExerciseDetector()
        self.api_client = APIClient()
        
        self.cap = None
        self.running = False
        self.frame_count = 0
        self.fps = 0
        self.last_fps_time = time.time()
        self.previous_tracks = {}  # Track previous frame's tracks for comparison
        
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, sig, frame):
        logger.info("Shutting down gracefully...")
        self.stop()
        sys.exit(0)
    
    def start(self):
        logger.info(f"Opening camera {Config.CAMERA_INDEX}...")
        self.cap = cv2.VideoCapture(Config.CAMERA_INDEX)
        
        if not self.cap.isOpened():
            logger.error("Failed to open camera")
            return
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, Config.FRAME_RATE)
        
        # Create a new session
        self.api_client.create_session()
        self.running = True
        
        logger.info("Perception service started. Press Ctrl+C to stop.")
        self._process_loop()
    
    def stop(self):
        self.running = False
        
        # Send person_lost for all remaining tracks
        for track_id in self.previous_tracks:
            self.api_client.send_person_lost(track_id)
        
        # End the session
        self.api_client.end_session()
        
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        
        logger.info("Perception service stopped")
    
    def _process_loop(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                logger.warning("Failed to read frame")
                continue
            
            processed_frame = self._process_frame(frame)
            
            self._update_fps()
            
            # Draw FPS and session info
            cv2.putText(processed_frame, f"FPS: {self.fps:.1f}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            if self.api_client.session_id:
                cv2.putText(processed_frame, f"Session: {self.api_client.session_id[:8]}...", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 1)
            
            if self.api_client.ws_connected:
                cv2.putText(processed_frame, "WS: Connected", (10, 90),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 1)
            else:
                cv2.putText(processed_frame, "WS: Disconnected", (10, 90),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 1)
            
            cv2.imshow('Vero Wellness - Perception', processed_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        self.stop()
    
    def _process_frame(self, frame: np.ndarray) -> np.ndarray:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Detect persons with YOLO
        results = self.yolo(rgb_frame, conf=Config.CONFIDENCE_THRESHOLD)
        
        detections = []
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    if int(box.cls) == 0:  # Person class
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        bbox = (int(x1), int(y1), int(x2), int(y2))
                        
                        # Extract pose for this person
                        person_roi = rgb_frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
                        if person_roi.size > 0:
                            keypoints = self._extract_pose(person_roi, bbox)
                        else:
                            keypoints = None
                        
                        detections.append((bbox, keypoints))
        
        # Update tracks
        tracks = self.tracker.update(detections)
        
        # Track which persons are in this frame
        current_track_ids = set()
        
        for track in tracks:
            current_track_ids.add(track.track_id)
            
            # Check if this is a new track (person detected)
            if track.track_id not in self.previous_tracks:
                self.api_client.send_person_detected(
                    track.track_id, track.bbox, track.confidence
                )
                logger.info(f"Person detected: {track.track_id}")
            
            # Process exercise detection if we have keypoints
            if track.keypoints:
                # Detect exercise type
                detected_exercise = self.exercise_detector.detect_exercise(track.keypoints)
                
                # If exercise newly detected, send event
                if detected_exercise and not track.exercise:
                    track.exercise = detected_exercise
                    self.api_client.send_exercise_started(
                        track.track_id, detected_exercise, track.set_number
                    )
                    logger.info(f"Exercise started: {track.track_id} - {detected_exercise}")
                
                # Count reps if exercise is active
                if track.exercise:
                    old_count = track.rep_count
                    track.rep_count, track.rep_state = self.exercise_detector.count_reps(
                        track, track.keypoints
                    )
                    
                    # If rep count increased, send event
                    if track.rep_count > old_count:
                        self.api_client.send_rep_completed(
                            track.track_id, track.exercise, 
                            track.rep_count, track.set_number
                        )
                        logger.info(f"Rep completed: {track.track_id} - {track.exercise} - Rep {track.rep_count}")
            
            # Draw the track visualization
            self._draw_track(frame, track)
        
        # Check for lost tracks (person lost)
        for track_id in self.previous_tracks:
            if track_id not in current_track_ids:
                self.api_client.send_person_lost(track_id)
                logger.info(f"Person lost: {track_id}")
        
        # Update previous tracks
        self.previous_tracks = {track.track_id: track for track in tracks}
        
        # Flush events periodically
        self.api_client.flush_events()
        
        self.frame_count += 1
        return frame
    
    def _extract_pose(self, roi: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[Dict]:
        """Extract pose keypoints from a person ROI"""
        results = self.pose.process(roi)
        
        if results.pose_landmarks:
            keypoints = {}
            landmarks = results.pose_landmarks.landmark
            
            # MediaPipe pose landmark names
            keypoint_names = [
                'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
                'right_eye_inner', 'right_eye', 'right_eye_outer',
                'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
                'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
                'left_index', 'right_index', 'left_thumb', 'right_thumb',
                'left_hip', 'right_hip', 'left_knee', 'right_knee',
                'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
                'left_foot_index', 'right_foot_index'
            ]
            
            roi_h, roi_w = roi.shape[:2]
            for i, name in enumerate(keypoint_names[:len(landmarks)]):
                if i < len(landmarks):
                    lm = landmarks[i]
                    # Convert from normalized coordinates to frame coordinates
                    x = bbox[0] + lm.x * roi_w
                    y = bbox[1] + lm.y * roi_h
                    keypoints[name] = (x, y, lm.visibility)
            
            return keypoints
        
        return None
    
    def _draw_track(self, frame: np.ndarray, track):
        """Draw bounding box and track information"""
        x1, y1, x2, y2 = track.bbox
        
        # Color based on confidence
        if track.confidence > 0.7:
            color = (0, 255, 0)  # Green for high confidence
        elif track.confidence > 0.4:
            color = (0, 255, 255)  # Yellow for medium confidence
        else:
            color = (0, 0, 255)  # Red for low confidence
        
        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        # Build label
        label_parts = [f"ID: {track.track_id[-4:]}"]  # Show last 4 chars of ID
        if track.member_id:
            label_parts.append(f"Member: {track.member_id}")
        if track.exercise:
            label_parts.append(f"{track.exercise}: {track.rep_count} reps")
            if track.last_angle is not None:
                label_parts.append(f"Angle: {track.last_angle:.0f}°")
        
        label = " | ".join(label_parts)
        
        # Draw label background
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - 25), (x1 + label_size[0] + 5, y1), color, -1)
        
        # Use black text on bright green background, white text otherwise
        text_color = (0, 0, 0) if color == (0, 255, 0) else (255, 255, 255)
        cv2.putText(frame, label, (x1 + 2, y1 - 8), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1)
        
        # Draw skeleton if keypoints available
        if track.keypoints:
            self._draw_skeleton(frame, track.keypoints)
    
    def _draw_skeleton(self, frame: np.ndarray, keypoints: Dict[str, Tuple[float, float, float]]):
        """Draw pose skeleton connections"""
        for connection in Config.POSE_CONNECTIONS:
            kp1_name, kp2_name = connection
            if kp1_name in keypoints and kp2_name in keypoints:
                kp1 = keypoints[kp1_name]
                kp2 = keypoints[kp2_name]
                
                # Only draw if both keypoints have sufficient confidence
                if kp1[2] > Config.POSE_THRESHOLD and kp2[2] > Config.POSE_THRESHOLD:
                    pt1 = (int(kp1[0]), int(kp1[1]))
                    pt2 = (int(kp2[0]), int(kp2[1]))
                    cv2.line(frame, pt1, pt2, (0, 255, 255), 2)
        
        # Draw keypoints
        for kp_name, (x, y, conf) in keypoints.items():
            if conf > Config.POSE_THRESHOLD:
                # Color based on body part
                if 'left' in kp_name:
                    color = (255, 0, 0)  # Blue for left side
                elif 'right' in kp_name:
                    color = (0, 0, 255)  # Red for right side
                else:
                    color = (0, 255, 0)  # Green for center
                
                cv2.circle(frame, (int(x), int(y)), 4, color, -1)
                cv2.circle(frame, (int(x), int(y)), 5, (255, 255, 255), 1)
    
    def _update_fps(self):
        """Update FPS calculation"""
        current_time = time.time()
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time

if __name__ == "__main__":
    service = PerceptionService()
    service.start()