import logging

import cv2
import numpy as np
from src.exercies.ExerciseBase import ExerciseBase
from src.utils import ang

logger = logging.getLogger(__name__)


class Lunges(ExerciseBase):
    """Lunges exercise detection with visual overlays"""
    
    def __init__(self):
        super().__init__()
        self.performed_lunge = False
        self.exercise_name = "lunges"
        self.frames = 0
        self.left_angle = 0
        self.right_angle = 0
    
    def draw_overlays(self, image, results):
        """Draw lunges-specific visual overlays"""
        idx = self.idx_to_coordinates
        
        try:
            # Draw hip - knee - ankle angle for left leg
            if 23 in idx and 25 in idx and 27 in idx:
                cv2.line(image, idx[23], idx[25], thickness=6, color=(255, 0, 0))
                cv2.line(image, idx[25], idx[27], thickness=6, color=(255, 0, 0))
                
                self.left_angle = ang((idx[23], idx[25]), (idx[25], idx[27]))
                
                cv2.putText(image, str(round(self.left_angle, 2)),
                           (idx[25][0] - 40, idx[25][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[23], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[23], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[25], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[25], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[27], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[27], 15, (0, 0, 255), 2)
                
                # Draw progress bar for left leg
                ang_display = 180 - self.left_angle
                c1 = (0, 255, 0) if ang_display > 70 else (255, 0, 0)
                bar_y = np.interp(ang_display, (10, 70), (450, 200))
                per = np.interp(ang_display, (10, 70), (0, 100))
                
                # Background bar
                cv2.rectangle(image, (50, 200), (110, 450), c1, 2)
                # Progress bar
                cv2.rectangle(image, (50, int(bar_y)), (110, 450), c1, cv2.FILLED)
                # Percentage text
                cv2.putText(image, f'L: {int(per)}%', (50, 180), 
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.7, color=c1, thickness=2)
            
            # Draw hip - knee - ankle angle for right leg
            if 24 in idx and 26 in idx and 28 in idx:
                cv2.line(image, idx[24], idx[26], thickness=6, color=(0, 0, 255))
                cv2.line(image, idx[26], idx[28], thickness=6, color=(0, 0, 255))
                
                self.right_angle = ang((idx[24], idx[26]), (idx[26], idx[28]))
                
                cv2.putText(image, str(round(self.right_angle, 2)),
                           (idx[26][0] - 40, idx[26][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[24], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[24], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[26], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[26], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[28], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[28], 15, (0, 0, 255), 2)
                
                # Draw progress bar for right leg
                ang_display = 180 - self.right_angle
                c2 = (0, 255, 0) if ang_display > 40 else (255, 0, 0)
                bar_y = np.interp(ang_display, (10, 40), (450, 200))
                per = np.interp(ang_display, (10, 40), (0, 100))
                
                # Background bar
                cv2.rectangle(image, (150, 200), (210, 450), c2, 2)
                # Progress bar
                cv2.rectangle(image, (150, int(bar_y)), (210, 450), c2, cv2.FILLED)
                # Percentage text
                cv2.putText(image, f'R: {int(per)}%', (150, 180), 
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.7, color=c2, thickness=2)
            
            # Draw lunge depth indicator
            if self.left_angle < 100 or self.right_angle < 100:
                side = "LEFT" if self.left_angle < 100 else "RIGHT"
                angle = self.left_angle if self.left_angle < 100 else self.right_angle
                depth_per = np.interp(angle, (70, 110), (100, 0))
                
                cv2.putText(image, f"{side} LUNGE", 
                           (250, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.putText(image, f"Depth: {int(depth_per)}%", 
                           (250, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        except:
            pass
    
    def track_exercise(self, landmarks):
        """Track lunge reps based on knee angles"""
        self.frames += 1
        
        # Wait for initial frames to stabilize
        if self.frames > 80:
            # Check for lunge position (either leg)
            if self.left_angle < 100 or self.right_angle < 100:
                self.performed_lunge = True
            
            # Check for return to standing position
            if (self.left_angle > 150 and self.right_angle > 150) and self.performed_lunge:
                self.rep_count += 1
                self.performed_lunge = False
                logger.info(f"Lunge rep completed: {self.rep_count}")
    
    def add_info_overlay(self, image):
        """Add lunges-specific info overlay"""
        h, w = image.shape[:2]
        
        # Add semi-transparent background
        overlay = image.copy()
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 255, 0), 2)
        cv2.addWeighted(overlay, 0.4, image, 0.6, 0, image)
        
        # Exercise name
        cv2.putText(image, "LUNGES", 
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
        
        # Show current lunge state
        if self.performed_lunge and 0 in self.idx_to_coordinates:
            cv2.putText(image, "LUNGE", 
                       (self.idx_to_coordinates[0][0] - 40, self.idx_to_coordinates[0][1] - 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
    
    def reset(self):
        """Reset lunges tracking stats"""
        super().reset()
        self.performed_lunge = False
        self.frames = 0
        self.left_angle = 0
        self.right_angle = 0