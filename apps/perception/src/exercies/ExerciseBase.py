"""
Base Exercise class for WebRTC streaming
Provides common functionality for all exercise types without GUI dependencies
"""

import cv2
import mediapipe as mp
import numpy as np
import logging
import os
from typing import Tuple, Optional, Dict
from mediapipe.python.solutions.drawing_utils import _normalized_to_pixel_coordinates

logger = logging.getLogger(__name__)

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose


class ExerciseBase:
    """Base class for all exercises - no GUI, WebRTC compatible"""
    
    def __init__(self):
        # Get thresholds from environment or use defaults
        min_detection = float(os.getenv('MIN_DETECTION_CONFIDENCE', '0.5'))
        min_tracking = float(os.getenv('MIN_TRACKING_CONFIDENCE', '0.5'))
        
        self.pose = mp_pose.Pose(
            min_detection_confidence=min_detection,
            min_tracking_confidence=min_tracking
        )
        
        # Drawing specs for pose overlay
        self.pose_landmark_drawing_spec = mp_drawing.DrawingSpec(
            thickness=5, circle_radius=2, color=(0, 0, 255)
        )
        self.pose_connection_drawing_spec = mp_drawing.DrawingSpec(
            thickness=1, circle_radius=1, color=(0, 255, 0)
        )
        
        # Common tracking variables
        self.rep_count = 0
        self.exercise_name = self.__class__.__name__.lower()
        
        # For storing pixel coordinates
        self.idx_to_coordinates = {}
        
        logger.info(f"Initialized {self.exercise_name} - Detection: {min_detection}, Tracking: {min_tracking}")
    
    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """
        Process a single frame for exercise tracking
        Returns: (processed_frame_with_overlay, stats_dict)
        """
        if frame is None:
            return frame, self.get_stats()
        
        # Create a copy for processing
        image = frame.copy()
        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        # Convert back to BGR for OpenCV
        image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        
        # Draw pose landmarks
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.pose_landmark_drawing_spec,
                connection_drawing_spec=self.pose_connection_drawing_spec
            )
            
            # Get pixel coordinates
            self.idx_to_coordinates = self.get_idx_to_coordinates(image, results)
            
            # Draw exercise-specific overlays
            self.draw_overlays(image, results)
            
            # Track exercise
            self.track_exercise(results.pose_landmarks)
        
        # Add info overlay
        self.add_info_overlay(image)
        
        return image, self.get_stats()
    
    def get_idx_to_coordinates(self, image, results, visibility_threshold=0.5, presence_threshold=0.5):
        """Convert normalized landmarks to pixel coordinates"""
        idx_to_coordinates = {}
        image_rows, image_cols, _ = image.shape
        try:
            for idx, landmark in enumerate(results.pose_landmarks.landmark):
                if ((landmark.HasField('visibility') and
                     landmark.visibility < visibility_threshold) or
                        (landmark.HasField('presence') and
                         landmark.presence < presence_threshold)):
                    continue
                landmark_px = _normalized_to_pixel_coordinates(
                    landmark.x, landmark.y, image_cols, image_rows
                )
                if landmark_px:
                    idx_to_coordinates[idx] = landmark_px
        except:
            pass
        return idx_to_coordinates
    
    def draw_overlays(self, image, results):
        """Override in subclass to draw exercise-specific overlays"""
        pass
    
    def track_exercise(self, landmarks):
        """Override in subclass to implement exercise tracking logic"""
        raise NotImplementedError("Subclass must implement track_exercise")
    
    def get_stats(self) -> Dict:
        """Get current exercise statistics"""
        return {
            'exercise': self.exercise_name,
            'rep_count': self.rep_count
        }
    
    def add_info_overlay(self, image):
        """Add exercise info overlay to the frame"""
        h, w = image.shape[:2]
        
        # Add semi-transparent background
        overlay = image.copy()
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 255, 0), 2)
        cv2.addWeighted(overlay, 0.4, image, 0.6, 0, image)
        
        # Exercise name
        cv2.putText(image, f"{self.exercise_name.upper()}", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Rep counter
        cv2.putText(image, f"Reps: ", 
                   (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(image, f"{self.rep_count}", 
                   (100, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
        
        # Set indicator
        sets = self.rep_count // 10 + 1 if self.rep_count > 0 else 1
        cv2.putText(image, f"Set: {sets}", 
                   (200, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        # Connection status
        cv2.circle(image, (25, 105), 5, (0, 255, 0), -1)
        cv2.putText(image, "WebRTC Live", 
                   (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    
    def reset(self):
        """Reset exercise tracking stats"""
        self.rep_count = 0
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if hasattr(self, 'pose') and self.pose:
                self.pose.close()
                self.pose = None
        except Exception as e:
            logger.warning(f"Error closing pose detector: {e}")
            # Set to None anyway to avoid reuse
            self.pose = None