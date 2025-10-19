import logging

import cv2
import numpy as np
from src.exercies.ExerciseBase import ExerciseBase
from src.utils import ang

logger = logging.getLogger(__name__)


class ShoulderTap(ExerciseBase):
    """Shoulder tap exercise detection with visual overlays"""
    
    def __init__(self):
        super().__init__()
        self.shoulder_tap_count = 0
        self.exercise_name = "shouldertap"
        self.performed_left_tap = False
        self.performed_right_tap = False
        self.frames = 0
        self.left_arm_angle = 0
        self.right_arm_angle = 0
        self.last_tap_side = None
    
    def draw_overlays(self, image, results):
        """Draw shoulder tap-specific visual overlays"""
        idx = self.idx_to_coordinates
        
        try:
            # Draw shoulder - elbow - wrist angle for left arm
            if 11 in idx and 13 in idx and 15 in idx:
                cv2.line(image, idx[11], idx[13], thickness=6, color=(255, 255, 0))
                cv2.line(image, idx[13], idx[15], thickness=6, color=(255, 255, 0))
                
                self.left_arm_angle = ang((idx[11], idx[13]), (idx[13], idx[15]))
                
                cv2.putText(image, str(round(self.left_arm_angle, 2)),
                           (idx[13][0] - 40, idx[13][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[11], 10, (255, 255, 0), cv2.FILLED)
                cv2.circle(image, idx[11], 15, (255, 255, 0), 2)
                cv2.circle(image, idx[13], 10, (255, 255, 0), cv2.FILLED)
                cv2.circle(image, idx[13], 15, (255, 255, 0), 2)
                cv2.circle(image, idx[15], 10, (255, 255, 0), cv2.FILLED)
                cv2.circle(image, idx[15], 15, (255, 255, 0), 2)
                
                # Draw progress bar for left arm
                ang_display = 180 - self.left_arm_angle
                c1 = (0, 255, 0) if ang_display > 70 else (255, 0, 0)
                bar_y = np.interp(ang_display, (10, 70), (450, 200))
                per = np.interp(ang_display, (10, 50), (0, 100))
                
                # Background bar
                cv2.rectangle(image, (50, 200), (110, 450), c1, 2)
                # Progress bar
                cv2.rectangle(image, (50, int(bar_y)), (110, 450), c1, cv2.FILLED)
                # Percentage text
                cv2.putText(image, f'L: {int(per)}%', (50, 180), 
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.7, color=c1, thickness=2)
                
                # Draw tap indicator
                if self.left_arm_angle < 120:
                    cv2.putText(image, "LEFT TAP!", 
                               (idx[15][0] - 30, idx[15][1] - 20),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            
            # Draw shoulder - elbow - wrist angle for right arm
            if 12 in idx and 14 in idx and 16 in idx:
                cv2.line(image, idx[12], idx[14], thickness=6, color=(255, 0, 255))
                cv2.line(image, idx[14], idx[16], thickness=6, color=(255, 0, 255))
                
                self.right_arm_angle = ang((idx[12], idx[14]), (idx[14], idx[16]))
                
                cv2.putText(image, str(round(self.right_arm_angle, 2)),
                           (idx[14][0] - 40, idx[14][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[12], 10, (255, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[12], 15, (255, 0, 255), 2)
                cv2.circle(image, idx[14], 10, (255, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[14], 15, (255, 0, 255), 2)
                cv2.circle(image, idx[16], 10, (255, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[16], 15, (255, 0, 255), 2)
                
                # Draw progress bar for right arm
                ang_display = 180 - self.right_arm_angle
                c2 = (0, 255, 0) if ang_display > 70 else (255, 0, 0)
                bar_y = np.interp(ang_display, (10, 70), (450, 200))
                per = np.interp(ang_display, (10, 50), (0, 100))
                
                # Background bar
                cv2.rectangle(image, (150, 200), (210, 450), c2, 2)
                # Progress bar
                cv2.rectangle(image, (150, int(bar_y)), (210, 450), c2, cv2.FILLED)
                # Percentage text
                cv2.putText(image, f'R: {int(per)}%', (150, 180), 
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.7, color=c2, thickness=2)
                
                # Draw tap indicator
                if self.right_arm_angle < 120:
                    cv2.putText(image, "RIGHT TAP!", 
                               (idx[16][0] - 30, idx[16][1] - 20),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)
            
            # Draw target circles on shoulders
            if 11 in idx:
                cv2.circle(image, idx[11], 30, (255, 255, 0), 3)
                cv2.putText(image, "L", (idx[11][0] - 8, idx[11][1] + 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)
            if 12 in idx:
                cv2.circle(image, idx[12], 30, (255, 0, 255), 3)
                cv2.putText(image, "R", (idx[12][0] - 8, idx[12][1] + 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
        except:
            pass
    
    def track_exercise(self, landmarks):
        """Track shoulder tap reps based on arm angles"""
        self.frames += 1
        
        # Wait for initial frames to stabilize
        if self.frames > 80:
            # Check for left arm tap
            if self.left_arm_angle < 120:
                self.performed_left_tap = True
                self.last_tap_side = "left"
            elif self.left_arm_angle > 150 and self.performed_left_tap:
                self.shoulder_tap_count += 1
                self.performed_left_tap = False
                logger.info(f"Left shoulder tap completed: {self.shoulder_tap_count}")
            
            # Check for right arm tap
            if self.right_arm_angle < 120:
                self.performed_right_tap = True
                self.last_tap_side = "right"
            elif self.right_arm_angle > 150 and self.performed_right_tap:
                self.shoulder_tap_count += 1
                self.performed_right_tap = False
                logger.info(f"Right shoulder tap completed: {self.shoulder_tap_count}")
    
    def get_stats(self) -> dict:
        """Get current exercise statistics"""
        return {
            'exercise': self.exercise_name,
            'rep_count': 0,  # Shoulder taps use tap count instead
            'shoulder_tap_count': self.shoulder_tap_count
        }
    
    def add_info_overlay(self, image):
        """Add shoulder tap-specific info overlay"""
        h, w = image.shape[:2]
        
        # Add semi-transparent background
        overlay = image.copy()
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 255, 0), 2)
        cv2.addWeighted(overlay, 0.4, image, 0.6, 0, image)
        
        # Exercise name
        cv2.putText(image, "SHOULDER TAPS", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Tap counter
        cv2.putText(image, f"Taps: ", 
                   (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(image, f"{self.shoulder_tap_count}", 
                   (100, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
        
        # Last tap side
        if self.last_tap_side:
            side_text = "LEFT" if self.last_tap_side == "left" else "RIGHT"
            color = (255, 255, 0) if self.last_tap_side == "left" else (255, 0, 255)
            cv2.putText(image, f"Last: {side_text}", 
                       (200, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Connection status
        cv2.circle(image, (25, 105), 5, (0, 255, 0), -1)
        cv2.putText(image, "WebRTC Live", 
                   (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Show tap count at top
        if 0 in self.idx_to_coordinates:
            cv2.putText(image, f"Taps: {self.shoulder_tap_count}",
                       (self.idx_to_coordinates[0][0] - 80, self.idx_to_coordinates[0][1] - 100),
                       fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                       fontScale=1.2, color=(0, 255, 0), thickness=3)
    
    def reset(self):
        """Reset shoulder tap tracking stats"""
        super().reset()
        self.shoulder_tap_count = 0
        self.performed_left_tap = False
        self.performed_right_tap = False
        self.frames = 0
        self.left_arm_angle = 0
        self.right_arm_angle = 0
        self.last_tap_side = None