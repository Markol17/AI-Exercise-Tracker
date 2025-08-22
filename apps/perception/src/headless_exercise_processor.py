"""
Headless exercise processor for WebRTC streaming
Processes frames with pose detection without GUI windows
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Tuple
import logging
import time
import math
import os
from mediapipe.python.solutions.drawing_utils import _normalized_to_pixel_coordinates

logger = logging.getLogger(__name__)

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

class HeadlessExerciseProcessor:
    """Process exercise frames without GUI for WebRTC streaming"""
    
    def __init__(self, exercise_type: str):
        self.exercise_type = exercise_type
        
        # Get thresholds from environment or use defaults
        min_detection = float(os.getenv('MIN_DETECTION_CONFIDENCE', '0.5'))
        min_tracking = float(os.getenv('MIN_TRACKING_CONFIDENCE', '0.5'))
        
        self.pose = mp_pose.Pose(
            min_detection_confidence=min_detection,
            min_tracking_confidence=min_tracking
        )
        
        logger.info(f"Initialized pose detection - Detection: {min_detection}, Tracking: {min_tracking}")
        self.rep_count = 0
        self.in_position = False
        self.plank_start_time = None
        self.plank_duration = 0.0
        self.shoulder_tap_count = 0
        self.last_tap_side = None
        
        # State tracking for exercises
        self.squat_performed = False
        self.pushup_state = "up"  # "up" or "down"
        self.lunge_side = None  # "left" or "right"
        
        # Drawing specs for pose overlay
        self.pose_landmark_drawing_spec = mp_drawing.DrawingSpec(
            thickness=2, circle_radius=2, color=(0, 255, 0)
        )
        self.pose_connection_drawing_spec = mp_drawing.DrawingSpec(
            thickness=2, circle_radius=1, color=(0, 255, 255)
        )
        
    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, dict]:
        """
        Process a single frame for exercise tracking
        Returns: (processed_frame_with_overlay, stats_dict)
        """
        if frame is None:
            return frame, {}
            
        # Create a copy for processing
        image = frame.copy()
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        # Draw pose landmarks on the image
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.pose_landmark_drawing_spec,
                connection_drawing_spec=self.pose_connection_drawing_spec,
            )
            
            # Get pixel coordinates for landmarks
            self.idx_to_coordinates = self._get_idx_to_coordinates(image, results)
            
            # Draw exercise-specific visual overlays
            self._draw_exercise_overlays(image, results.pose_landmarks)
            
            # Track exercise based on type
            self._track_exercise(results.pose_landmarks)
        
        # Add exercise info overlay
        self._add_info_overlay(image)
        
        # Prepare stats
        stats = {
            'exercise': self.exercise_type,
            'rep_count': self.rep_count,
            'plank_duration': self.plank_duration,
            'shoulder_tap_count': self.shoulder_tap_count,
        }
        
        return image, stats
    
    def _track_exercise(self, landmarks):
        """Track exercise based on pose landmarks"""
        if self.exercise_type == 'squat':
            self._track_squat(landmarks)
        elif self.exercise_type == 'pushup':
            self._track_pushup(landmarks)
        elif self.exercise_type == 'plank':
            self._track_plank(landmarks)
        elif self.exercise_type == 'lunges':
            self._track_lunges(landmarks)
        elif self.exercise_type == 'shouldertap':
            self._track_shoulder_tap(landmarks)
    
    def _track_squat(self, landmarks):
        """Track squat reps based on hip-knee distance (like original Squat.py)"""
        # Get landmarks with visibility check
        left_hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
        left_knee = landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE]
        right_knee = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE]
        
        # Check visibility
        if (left_hip.visibility < 0.5 and right_hip.visibility < 0.5) or \
           (left_knee.visibility < 0.5 and right_knee.visibility < 0.5):
            return
        
        # Use the most visible hip and knee
        if left_hip.visibility > right_hip.visibility:
            hip = left_hip
        else:
            hip = right_hip
            
        if left_knee.visibility > right_knee.visibility:
            knee = left_knee
        else:
            knee = right_knee
        
        # Convert normalized coordinates to pixels (assuming 640x480 frame)
        # In actual use, we should get real frame dimensions
        hip_y_pixel = hip.y * 480
        knee_y_pixel = knee.y * 480
        
        # Check if in squat position (hip close to knee level - within 35 pixels)
        if abs(hip_y_pixel - knee_y_pixel) < 35:
            self.squat_performed = True
        elif abs(hip_y_pixel - knee_y_pixel) > 35 and self.squat_performed:
            self.rep_count += 1
            self.squat_performed = False
            logger.info(f"Squat rep completed: {self.rep_count}")
    
    def _track_pushup(self, landmarks):
        """Track pushup reps based on elbow angle"""
        # Get shoulder, elbow, wrist positions
        left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
        left_elbow = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW]
        left_wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
        right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        right_elbow = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ELBOW]
        right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST]
        
        # Check visibility
        if left_elbow.visibility < 0.5 and right_elbow.visibility < 0.5:
            return
        
        # Calculate elbow angle for the most visible arm
        if left_elbow.visibility > right_elbow.visibility:
            angle = self._calculate_angle(
                (left_shoulder.x, left_shoulder.y),
                (left_elbow.x, left_elbow.y),
                (left_wrist.x, left_wrist.y)
            )
        else:
            angle = self._calculate_angle(
                (right_shoulder.x, right_shoulder.y),
                (right_elbow.x, right_elbow.y),
                (right_wrist.x, right_wrist.y)
            )
        
        # Track pushup state based on elbow angle
        if angle > 160 and self.pushup_state == "down":
            self.pushup_state = "up"
            self.rep_count += 1
            logger.info(f"Pushup rep completed: {self.rep_count}")
        elif angle < 90:
            self.pushup_state = "down"
    
    def _track_plank(self, landmarks):
        """Track plank duration"""
        # Check if in plank position
        left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
        left_ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]
        right_ankle = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE]
        
        # Check visibility
        shoulder_visible = left_shoulder.visibility > 0.5 or right_shoulder.visibility > 0.5
        hip_visible = left_hip.visibility > 0.5 or right_hip.visibility > 0.5
        ankle_visible = left_ankle.visibility > 0.5 or right_ankle.visibility > 0.5
        
        if not (shoulder_visible and hip_visible and ankle_visible):
            return
        
        # Average positions
        shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_y = (left_hip.y + right_hip.y) / 2
        ankle_y = (left_ankle.y + right_ankle.y) / 2
        
        # Check if body is roughly horizontal (plank position)
        # Shoulder, hip, and ankle should be roughly aligned
        if abs(shoulder_y - hip_y) < 0.15 and abs(hip_y - ankle_y) < 0.2:
            if self.plank_start_time is None:
                self.plank_start_time = time.time()
                logger.info("Plank started")
            self.plank_duration = time.time() - self.plank_start_time
        else:
            if self.plank_start_time is not None:
                logger.info(f"Plank ended - duration: {self.plank_duration:.1f}s")
            self.plank_start_time = None
    
    def _track_lunges(self, landmarks):
        """Track lunge reps based on knee angles"""
        # Get hip, knee, and ankle positions
        left_hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
        left_knee = landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE]
        right_knee = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE]
        left_ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]
        right_ankle = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE]
        
        # Check visibility
        if left_knee.visibility < 0.5 or right_knee.visibility < 0.5:
            return
        
        # Calculate knee angles
        left_angle = self._calculate_angle(
            (left_hip.x, left_hip.y),
            (left_knee.x, left_knee.y),
            (left_ankle.x, left_ankle.y)
        )
        right_angle = self._calculate_angle(
            (right_hip.x, right_hip.y),
            (right_knee.x, right_knee.y),
            (right_ankle.x, right_ankle.y)
        )
        
        # Check for lunge position (one knee bent at ~90 degrees)
        if left_angle < 110 and right_angle > 150:
            if self.lunge_side != "left":
                self.lunge_side = "left"
                self.rep_count += 1
                logger.info(f"Left lunge completed: {self.rep_count}")
        elif right_angle < 110 and left_angle > 150:
            if self.lunge_side != "right":
                self.lunge_side = "right"
                self.rep_count += 1
                logger.info(f"Right lunge completed: {self.rep_count}")
        elif left_angle > 150 and right_angle > 150:
            self.lunge_side = None
    
    def _track_shoulder_tap(self, landmarks):
        """Track shoulder tap reps"""
        # Get hand and shoulder positions
        left_wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
        right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST]
        left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        
        # Check visibility
        if (left_wrist.visibility < 0.5 and right_wrist.visibility < 0.5) or \
           (left_shoulder.visibility < 0.5 and right_shoulder.visibility < 0.5):
            return
        
        # Calculate distances between hands and opposite shoulders
        left_to_right_dist = self._calculate_distance(
            (left_wrist.x, left_wrist.y),
            (right_shoulder.x, right_shoulder.y)
        )
        right_to_left_dist = self._calculate_distance(
            (right_wrist.x, right_wrist.y),
            (left_shoulder.x, left_shoulder.y)
        )
        
        # Check for shoulder tap (hand close to opposite shoulder)
        threshold = 0.1  # Normalized distance threshold
        
        if left_to_right_dist < threshold and self.last_tap_side != "left":
            self.last_tap_side = "left"
            self.shoulder_tap_count += 1
            logger.info(f"Left hand tap: {self.shoulder_tap_count}")
        elif right_to_left_dist < threshold and self.last_tap_side != "right":
            self.last_tap_side = "right"
            self.shoulder_tap_count += 1
            logger.info(f"Right hand tap: {self.shoulder_tap_count}")
        elif left_to_right_dist > threshold * 2 and right_to_left_dist > threshold * 2:
            self.last_tap_side = None
    
    def _add_info_overlay(self, image):
        """Add exercise info overlay to the frame"""
        h, w = image.shape[:2]
        
        # Add semi-transparent background with gradient effect
        overlay = image.copy()
        
        # Main info box
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 255, 0), 2)
        image = cv2.addWeighted(overlay, 0.4, image, 0.6, 0)
        
        # Exercise name with icon
        exercise_icons = {
            'squat': '🏋️',
            'pushup': '💪',
            'lunges': '🦵',
            'plank': '🧘',
            'shouldertap': '🤸'
        }
        icon = exercise_icons.get(self.exercise_type, '🏃')
        
        cv2.putText(image, f"{self.exercise_type.upper()}", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Stats with visual indicators
        if self.exercise_type == 'plank':
            # Draw timer icon and duration
            cv2.putText(image, f"Duration: {self.plank_duration:.1f}s", 
                       (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            # Add progress indicator for plank
            if self.plank_duration > 0:
                progress = min(self.plank_duration / 60, 1.0)  # 60 seconds as target
                bar_width = int(300 * progress)
                cv2.rectangle(image, (20, 80), (20 + bar_width, 85), (0, 255, 0), -1)
                cv2.rectangle(image, (20, 80), (320, 85), (100, 100, 100), 1)
                
        elif self.exercise_type == 'shouldertap':
            cv2.putText(image, f"Taps: {self.shoulder_tap_count}", 
                       (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            # Visual tap indicator
            if self.last_tap_side:
                side_text = "LEFT" if self.last_tap_side == "left" else "RIGHT"
                color = (255, 255, 0) if self.last_tap_side == "left" else (255, 0, 255)
                cv2.putText(image, f"Last: {side_text}", 
                           (200, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        else:
            # Rep counter with visual emphasis
            cv2.putText(image, f"Reps: ", 
                       (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(image, f"{self.rep_count}", 
                       (100, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
            
            # Add set indicator
            sets = self.rep_count // 10 + 1 if self.rep_count > 0 else 1
            cv2.putText(image, f"Set: {sets}", 
                       (200, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        # Connection status with indicator
        cv2.circle(image, (25, 105), 5, (0, 255, 0), -1)  # Green dot for connected
        cv2.putText(image, "WebRTC Live", 
                   (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Add form feedback if applicable
        if hasattr(self, 'form_feedback') and self.form_feedback:
            cv2.putText(image, self.form_feedback, 
                       (w - 300, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        
        return image
    
    def _calculate_angle(self, p1, p2, p3):
        """Calculate angle between three points"""
        # Vector from p2 to p1
        v1 = (p1[0] - p2[0], p1[1] - p2[1])
        # Vector from p2 to p3
        v2 = (p3[0] - p2[0], p3[1] - p2[1])
        
        # Calculate angle using dot product
        dot_product = v1[0] * v2[0] + v1[1] * v2[1]
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
        
        if mag1 == 0 or mag2 == 0:
            return 0
        
        cos_angle = dot_product / (mag1 * mag2)
        cos_angle = max(-1, min(1, cos_angle))  # Clamp to [-1, 1]
        angle_rad = math.acos(cos_angle)
        angle_deg = math.degrees(angle_rad)
        
        return angle_deg
    
    def _calculate_distance(self, p1, p2):
        """Calculate Euclidean distance between two points"""
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
    
    def _get_idx_to_coordinates(self, image, results, visibility_threshold=0.5, presence_threshold=0.5):
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
                landmark_px = _normalized_to_pixel_coordinates(landmark.x, landmark.y,
                                                               image_cols, image_rows)
                if landmark_px:
                    idx_to_coordinates[idx] = landmark_px
        except:
            pass
        return idx_to_coordinates
    
    def _draw_exercise_overlays(self, image, landmarks):
        """Draw exercise-specific visual overlays"""
        if not hasattr(self, 'idx_to_coordinates'):
            return
            
        if self.exercise_type == 'squat':
            self._draw_squat_overlays(image)
        elif self.exercise_type == 'pushup':
            self._draw_pushup_overlays(image)
        elif self.exercise_type == 'lunges':
            self._draw_lunges_overlays(image)
        elif self.exercise_type == 'plank':
            self._draw_plank_overlays(image)
        elif self.exercise_type == 'shouldertap':
            self._draw_shoulder_tap_overlays(image)
    
    def _draw_squat_overlays(self, image):
        """Draw visual overlays for squats"""
        idx = self.idx_to_coordinates
        
        # Draw knee angles
        if 24 in idx and 26 in idx and 28 in idx:
            # Right leg
            angle = self._draw_angle_visualization(image, idx[24], idx[26], idx[28], color=(0, 0, 255))
            
        if 23 in idx and 25 in idx and 27 in idx:
            # Left leg
            angle = self._draw_angle_visualization(image, idx[23], idx[25], idx[27], color=(255, 0, 0))
        
        # Draw hip-back angles
        if 12 in idx and 24 in idx and 26 in idx:
            self._draw_angle_visualization(image, idx[12], idx[24], idx[26], color=(255, 0, 255))
        elif 11 in idx and 23 in idx and 25 in idx:
            self._draw_angle_visualization(image, idx[11], idx[23], idx[25], color=(255, 255, 0))
        
        # Draw squat depth indicator
        if (23 in idx or 24 in idx) and (25 in idx or 26 in idx):
            hip_idx = 24 if 24 in idx else 23
            knee_idx = 26 if 26 in idx else 25
            
            # Draw vertical distance line
            cv2.line(image, (idx[hip_idx][0], idx[hip_idx][1]), 
                    (idx[hip_idx][0], idx[knee_idx][1]), (0, 255, 255), 2)
            
            # Calculate and show depth
            depth = abs(idx[hip_idx][1] - idx[knee_idx][1])
            depth_text = "DEEP" if depth < 35 else "PARTIAL"
            color = (0, 255, 0) if depth < 35 else (0, 165, 255)
            
            cv2.putText(image, f"Depth: {depth:.0f}px ({depth_text})", 
                       (idx[hip_idx][0] + 10, idx[hip_idx][1] - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    def _draw_pushup_overlays(self, image):
        """Draw visual overlays for pushups"""
        idx = self.idx_to_coordinates
        
        # Draw elbow angles
        if 12 in idx and 14 in idx and 16 in idx:
            # Right arm
            self._draw_angle_visualization(image, idx[12], idx[14], idx[16], color=(255, 0, 255))
        
        if 11 in idx and 13 in idx and 15 in idx:
            # Left arm
            self._draw_angle_visualization(image, idx[11], idx[13], idx[15], color=(255, 255, 0))
    
    def _draw_lunges_overlays(self, image):
        """Draw visual overlays for lunges"""
        idx = self.idx_to_coordinates
        
        # Draw knee angles for both legs
        if 23 in idx and 25 in idx and 27 in idx:
            # Left leg
            angle = self._draw_angle_visualization(image, idx[23], idx[25], idx[27], color=(255, 0, 0))
            # Add percentage indicator
            if angle < 110:
                self._draw_progress_bar(image, idx[25], angle, 90, 160, "Lunge Depth")
        
        if 24 in idx and 26 in idx and 28 in idx:
            # Right leg
            angle = self._draw_angle_visualization(image, idx[24], idx[26], idx[28], color=(0, 0, 255))
            # Add percentage indicator
            if angle < 110:
                self._draw_progress_bar(image, idx[26], angle, 90, 160, "Lunge Depth")
    
    def _draw_plank_overlays(self, image):
        """Draw visual overlays for plank"""
        idx = self.idx_to_coordinates
        
        # Draw body alignment line
        if 12 in idx and 24 in idx and 28 in idx:
            cv2.line(image, idx[12], idx[24], (0, 255, 0), 2)
            cv2.line(image, idx[24], idx[28], (0, 255, 0), 2)
            
            # Calculate and show alignment angle
            angle = self._calculate_angle(idx[12], idx[24], idx[28])
            alignment = abs(180 - angle)
            color = (0, 255, 0) if alignment < 15 else (0, 165, 255) if alignment < 25 else (0, 0, 255)
            cv2.putText(image, f"Alignment: {alignment:.1f}°", 
                       (idx[24][0] + 20, idx[24][1]), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    def _draw_shoulder_tap_overlays(self, image):
        """Draw visual overlays for shoulder taps"""
        idx = self.idx_to_coordinates
        
        # Draw target circles on shoulders
        if 11 in idx:
            cv2.circle(image, idx[11], 30, (255, 255, 0), 2)
        if 12 in idx:
            cv2.circle(image, idx[12], 30, (255, 0, 255), 2)
        
        # Draw lines from hands to opposite shoulders
        if 15 in idx and 12 in idx:  # Left hand to right shoulder
            cv2.line(image, idx[15], idx[12], (255, 255, 0), 1, cv2.LINE_AA)
        if 16 in idx and 11 in idx:  # Right hand to left shoulder
            cv2.line(image, idx[16], idx[11], (255, 0, 255), 1, cv2.LINE_AA)
    
    def _draw_angle_visualization(self, image, p1, p2, p3, color=(0, 255, 0)):
        """Draw angle visualization with arc and text"""
        # Draw lines
        cv2.line(image, p1, p2, color, 3)
        cv2.line(image, p2, p3, color, 3)
        
        # Calculate angle
        angle = self._calculate_angle(p1, p2, p3)
        
        # Draw angle text
        cv2.putText(image, f"{angle:.0f}°", 
                   (p2[0] - 30, p2[1] - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Draw arc
        self._draw_angle_arc(image, p1, p2, p3, color)
        
        return angle
    
    def _draw_angle_arc(self, image, p1, p2, p3, color):
        """Draw an arc to visualize the angle"""
        # Create vectors
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        
        # Normalize vectors
        v1_norm = v1 / (np.linalg.norm(v1) + 1e-6)
        v2_norm = v2 / (np.linalg.norm(v2) + 1e-6)
        
        # Arc radius
        radius = 40
        
        # Calculate arc points
        num_points = 20
        arc_points = []
        
        angle1 = np.arctan2(v1[1], v1[0])
        angle2 = np.arctan2(v2[1], v2[0])
        
        # Ensure we draw the smaller arc
        if angle2 - angle1 > np.pi:
            angle2 -= 2 * np.pi
        elif angle1 - angle2 > np.pi:
            angle1 -= 2 * np.pi
        
        for i in range(num_points + 1):
            t = i / num_points
            angle = angle1 + t * (angle2 - angle1)
            x = int(p2[0] + radius * np.cos(angle))
            y = int(p2[1] + radius * np.sin(angle))
            arc_points.append((x, y))
        
        # Draw arc
        for i in range(len(arc_points) - 1):
            cv2.line(image, arc_points[i], arc_points[i + 1], color, 2)
    
    def _draw_progress_bar(self, image, position, current_value, min_value, max_value, label):
        """Draw a progress bar for exercise completion"""
        # Calculate percentage
        percentage = max(0, min(100, (current_value - min_value) / (max_value - min_value) * 100))
        
        # Bar dimensions
        bar_width = 100
        bar_height = 10
        x = position[0] + 50
        y = position[1]
        
        # Draw background
        cv2.rectangle(image, (x, y), (x + bar_width, y + bar_height), (100, 100, 100), -1)
        
        # Draw progress
        progress_width = int(bar_width * percentage / 100)
        color = (0, 255, 0) if percentage > 80 else (0, 165, 255) if percentage > 50 else (0, 0, 255)
        cv2.rectangle(image, (x, y), (x + progress_width, y + bar_height), color, -1)
        
        # Draw border
        cv2.rectangle(image, (x, y), (x + bar_width, y + bar_height), (255, 255, 255), 1)
        
        # Draw label
        cv2.putText(image, f"{label}: {percentage:.0f}%", 
                   (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def reset(self):
        """Reset exercise tracking stats"""
        self.rep_count = 0
        self.in_position = False
        self.plank_start_time = None
        self.plank_duration = 0.0
        self.shoulder_tap_count = 0
        self.last_tap_side = None
        self.squat_performed = False
        self.pushup_state = "up"
        self.lunge_side = None
    
    def cleanup(self):
        """Clean up resources"""
        if self.pose:
            self.pose.close()