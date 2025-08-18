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
        
        self.api_client.create_session()
        self.running = True
        
        logger.info("Perception service started. Press Ctrl+C to stop.")
        self._process_loop()
    
    def stop(self):
        self.running = False
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
            
            cv2.putText(processed_frame, f"FPS: {self.fps:.1f}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow('Vero Wellness - Perception', processed_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        self.stop()
    
    def _process_frame(self, frame: np.ndarray) -> np.ndarray:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        results = self.yolo(rgb_frame, conf=Config.CONFIDENCE_THRESHOLD)
        
        detections = []
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    if int(box.cls) == 0:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        bbox = (int(x1), int(y1), int(x2), int(y2))
                        
                        person_roi = rgb_frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
                        if person_roi.size > 0:
                            keypoints = self._extract_pose(person_roi, bbox)
                        else:
                            keypoints = None
                        
                        detections.append((bbox, keypoints))
        
        tracks = self.tracker.update(detections)
        
        for track in tracks:
            if track.keypoints:
                detected_exercise = self.exercise_detector.detect_exercise(track.keypoints)
                
                if detected_exercise and not track.exercise:
                    track.exercise = detected_exercise
                    self.api_client.send_exercise_started(
                        track.track_id, detected_exercise, track.set_number
                    )
                
                if track.exercise:
                    old_count = track.rep_count
                    track.rep_count, track.rep_state = self.exercise_detector.count_reps(
                        track, track.keypoints
                    )
                    
                    if track.rep_count > old_count:
                        self.api_client.send_rep_completed(
                            track.track_id, track.exercise, 
                            track.rep_count, track.set_number
                        )
            
            self._draw_track(frame, track)
        
        self.frame_count += 1
        return frame
    
    def _extract_pose(self, roi: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[Dict]:
        results = self.pose.process(roi)
        
        if results.pose_landmarks:
            keypoints = {}
            landmarks = results.pose_landmarks.landmark
            
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
                    x = bbox[0] + lm.x * roi_w
                    y = bbox[1] + lm.y * roi_h
                    keypoints[name] = (x, y, lm.visibility)
            
            return keypoints
        
        return None
    
    def _draw_track(self, frame: np.ndarray, track):
        x1, y1, x2, y2 = track.bbox
        color = (0, 255, 0) if track.confidence > 0.7 else (0, 255, 255)
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        label_parts = [track.track_id]
        if track.member_id:
            label_parts.append(f"ID: {track.member_id}")
        if track.exercise:
            label_parts.append(f"{track.exercise}: {track.rep_count}")
        
        label = " | ".join(label_parts)
        
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - 20), (x1 + label_size[0], y1), color, -1)
        cv2.putText(frame, label, (x1, y1 - 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        if track.keypoints:
            for kp_name, (x, y, conf) in track.keypoints.items():
                if conf > Config.POSE_THRESHOLD:
                    cv2.circle(frame, (int(x), int(y)), 3, (0, 0, 255), -1)
    
    def _update_fps(self):
        current_time = time.time()
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time

if __name__ == "__main__":
    service = PerceptionService()
    service.start()