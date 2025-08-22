"""
Plank exercise detection for WebRTC streaming
Based on original-perception implementation but without GUI
"""

import cv2
import numpy as np
import logging
import time
from src.exercies.ExerciseBase import ExerciseBase
from src.utils import ang

logger = logging.getLogger(__name__)


class Plank(ExerciseBase):
    """Plank exercise detection with duration tracking"""
    
    def __init__(self):
        super().__init__()
        self.plank_timer = None
        self.plank_duration = 0
        self.exercise_name = "plank"
        self.current_angle = 0
    
    def draw_overlays(self, image, results):
        """Draw plank-specific visual overlays"""
        idx = self.idx_to_coordinates
        
        try:
            # Draw shoulder - back - ankle alignment (left side)
            if 11 in idx and 23 in idx and 27 in idx:
                cv2.line(image, idx[11], idx[23], thickness=6, color=(255, 0, 0))
                cv2.line(image, idx[23], idx[27], thickness=6, color=(255, 0, 0))
                
                self.current_angle = ang((idx[11], idx[23]), (idx[23], idx[27]))
                
                cv2.putText(image, str(round(self.current_angle, 2)),
                           (idx[23][0] - 40, idx[23][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[11], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[11], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[23], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[23], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[27], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[27], 15, (0, 0, 255), 2)
            
            # Draw shoulder - back - ankle alignment (right side) as backup
            elif 12 in idx and 24 in idx and 28 in idx:
                cv2.line(image, idx[12], idx[24], thickness=6, color=(0, 0, 255))
                cv2.line(image, idx[24], idx[28], thickness=6, color=(0, 0, 255))
                
                self.current_angle = ang((idx[12], idx[24]), (idx[24], idx[28]))
                
                cv2.putText(image, str(round(self.current_angle, 2)),
                           (idx[24][0] - 40, idx[24][1] - 50),
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.8, color=(0, 255, 0), thickness=3)
                
                # Draw joint circles
                cv2.circle(image, idx[12], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[12], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[24], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[24], 15, (0, 0, 255), 2)
                cv2.circle(image, idx[28], 10, (0, 0, 255), cv2.FILLED)
                cv2.circle(image, idx[28], 15, (0, 0, 255), 2)
            
            # Draw progress bar
            if self.current_angle > 0:
                bar = np.interp(self.current_angle, (120, 170), (550, 300))
                per = np.interp(self.current_angle, (120, 170), (0, 100))
                
                # Background bar
                cv2.rectangle(image, (200, 300), (260, 550), (100, 100, 100), 2)
                
                # Progress bar
                color = (0, 255, 0) if self.current_angle > 170 else (0, 165, 255) if self.current_angle > 150 else (0, 0, 255)
                cv2.rectangle(image, (200, int(bar)), (260, 550), color, cv2.FILLED)
                
                # Percentage text
                cv2.putText(image, f'{int(per)} %', (200, 280), 
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=1.1, color=color, thickness=3)
        except:
            pass
    
    def track_exercise(self, landmarks):
        """Track plank duration based on body alignment"""
        # Check if angle is good for plank (>170 degrees means good alignment)
        if self.current_angle > 170:
            if self.plank_timer is None:
                self.plank_timer = time.time()
                logger.info("Plank started")
            else:
                # Update duration
                self.plank_duration = time.time() - self.plank_timer
        else:
            if self.plank_timer is not None:
                logger.info(f"Plank ended - duration: {self.plank_duration:.1f}s")
            self.plank_timer = None
    
    def get_stats(self) -> dict:
        """Get current exercise statistics"""
        return {
            'exercise': self.exercise_name,
            'rep_count': 0,  # Plank doesn't have reps
            'plank_duration': self.plank_duration
        }
    
    def add_info_overlay(self, image):
        """Add plank-specific info overlay"""
        h, w = image.shape[:2]
        
        # Add semi-transparent background
        overlay = image.copy()
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 255, 0), 2)
        cv2.addWeighted(overlay, 0.4, image, 0.6, 0, image)
        
        # Exercise name
        cv2.putText(image, "PLANK", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Duration
        cv2.putText(image, f"Duration: {self.plank_duration:.1f}s", 
                   (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # Progress indicator
        if self.plank_duration > 0:
            progress = min(self.plank_duration / 60, 1.0)  # 60 seconds as target
            bar_width = int(300 * progress)
            cv2.rectangle(image, (20, 80), (20 + bar_width, 85), (0, 255, 0), -1)
            cv2.rectangle(image, (20, 80), (320, 85), (100, 100, 100), 1)
        
        # Connection status
        cv2.circle(image, (25, 105), 5, (0, 255, 0), -1)
        cv2.putText(image, "WebRTC Live", 
                   (40, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Show timer at top if in position
        if self.plank_timer and 0 in self.idx_to_coordinates:
            cv2.putText(image, f"Plank Timer: {round(self.plank_duration)} sec",
                       (self.idx_to_coordinates[0][0] - 60, self.idx_to_coordinates[0][1] - 100),
                       fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                       fontScale=0.9, color=(0, 255, 0), thickness=3)
    
    def reset(self):
        """Reset plank tracking stats"""
        super().reset()
        self.plank_timer = None
        self.plank_duration = 0
        self.current_angle = 0