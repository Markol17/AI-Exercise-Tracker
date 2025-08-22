"""
Pushup exercise detection for WebRTC streaming
Based on original-perception implementation but without GUI
"""

import cv2
import numpy as np
import logging
from src.exercies.ExerciseBase import ExerciseBase
from src.utils import ang, convert_arc, draw_ellipse

logger = logging.getLogger(__name__)


class Pushup(ExerciseBase):
    """Pushup exercise detection with visual overlays"""
    
    def __init__(self):
        super().__init__()
        self.performed_pushup = False
        self.exercise_name = "pushup"
    
    def draw_overlays(self, image, results):
        """Draw pushup-specific visual overlays"""
        idx = self.idx_to_coordinates
        
        try:
            # Draw shoulder - ankle - wrist angle (body alignment)
            if 12 in idx and 28 in idx and 16 in idx:  # Right side
                cv2.line(image, idx[12], idx[28], thickness=4, color=(255, 0, 255))
                cv2.line(image, idx[28], idx[16], thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[12], idx[28], 100)
                l2 = np.linspace(idx[28], idx[16], 100)
                eang1 = ang((idx[12], idx[28]), (idx[28], idx[16]))
                
                cv2.putText(image, str(round(eang1, 2)), idx[28],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
                
            elif 11 in idx and 27 in idx and 15 in idx:  # Left side
                cv2.line(image, idx[11], idx[27], thickness=4, color=(255, 0, 255))
                cv2.line(image, idx[27], idx[15], thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[11], idx[27], 100)
                l2 = np.linspace(idx[27], idx[15], 100)
                eang1 = ang((idx[11], idx[27]), (idx[27], idx[15]))
                
                cv2.putText(image, str(round(eang1, 2)), idx[27],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
        except:
            pass
        
        try:
            # Draw shoulder - elbow - wrist angle (arm angle)
            if 12 in idx and 14 in idx and 16 in idx:  # Right arm
                cv2.line(image, idx[12], idx[14], thickness=4, color=(255, 0, 255))
                cv2.line(image, idx[14], idx[16], thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[12], idx[14], 100)
                l2 = np.linspace(idx[14], idx[16], 100)
                ang1 = ang((idx[12], idx[14]), (idx[14], idx[16]))
                
                cv2.putText(image, "   " + str(round(ang1, 2)), idx[14],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
                
                # Color indicator for arm angle
                if ang1 < 90:
                    cv2.circle(image, idx[14], 10, (0, 255, 0), -1)  # Green = down position
                elif ang1 > 160:
                    cv2.circle(image, idx[14], 10, (0, 165, 255), -1)  # Orange = up position
                    
            elif 11 in idx and 13 in idx and 15 in idx:  # Left arm
                cv2.line(image, idx[11], idx[13], thickness=4, color=(255, 0, 255))
                cv2.line(image, idx[13], idx[15], thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[11], idx[13], 100)
                l2 = np.linspace(idx[13], idx[15], 100)
                ang1 = ang((idx[11], idx[13]), (idx[13], idx[15]))
                
                cv2.putText(image, str(round(ang1, 2)), idx[13],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
                
                # Color indicator for arm angle
                if ang1 < 90:
                    cv2.circle(image, idx[13], 10, (0, 255, 0), -1)  # Green = down position
                elif ang1 > 160:
                    cv2.circle(image, idx[13], 10, (0, 165, 255), -1)  # Orange = up position
        except:
            pass
        
        try:
            # Draw elbow - wrist - horizontal ground angle (wrist alignment)
            if 14 in idx and 16 in idx:  # Right side
                cv2.line(image, idx[14], idx[16], thickness=4, color=(255, 0, 255))
                temp = (idx[16][0] + 80, idx[16][1])
                cv2.line(image, idx[16], temp, thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[14], idx[16], 100)
                l2 = np.linspace(idx[16], temp, 100)
                ang1 = ang((idx[14], idx[16]), (idx[16], temp))
                
                cv2.putText(image, "   " + str(round(ang1, 2)), idx[16],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
                
            elif 13 in idx and 15 in idx:  # Left side
                cv2.line(image, idx[13], idx[15], thickness=4, color=(255, 0, 255))
                temp = (idx[15][0] + 80, idx[15][1])
                cv2.line(image, idx[15], temp, thickness=4, color=(255, 0, 255))
                
                l1 = np.linspace(idx[13], idx[15], 100)
                l2 = np.linspace(idx[15], temp, 100)
                ang1 = ang((idx[13], idx[15]), (idx[15], temp))
                
                cv2.putText(image, "   " + str(round(ang1, 2)), idx[15],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
        except:
            pass
        
        # Draw depth indicator
        try:
            if (11 in idx or 12 in idx) and (15 in idx or 16 in idx):
                shoulder_idx = 12 if 12 in idx else 11
                wrist_idx = 16 if 16 in idx else 15
                
                # Vertical distance indicator
                depth = abs(idx[shoulder_idx][1] - idx[wrist_idx][1])
                depth_text = "DOWN" if depth < 300 else "UP"
                color = (0, 255, 0) if depth < 300 else (0, 165, 255)
                
                cv2.putText(image, f"Position: {depth_text}", 
                           (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        except:
            pass
    
    def track_exercise(self, landmarks):
        """Track pushup reps based on shoulder-wrist vertical distance"""
        idx = self.idx_to_coordinates
        
        try:
            # Get shoulder and wrist coordinates
            if 12 in idx:
                shoulder_coord = idx[12]
            elif 11 in idx:
                shoulder_coord = idx[11]
            else:
                return
            
            if 16 in idx:
                wrist_coord = idx[16]
            elif 15 in idx:
                wrist_coord = idx[15]
            else:
                return
            
            # Check pushup position based on vertical distance
            if abs(shoulder_coord[1] - wrist_coord[1]) < 300:
                self.performed_pushup = True
            elif abs(shoulder_coord[1] - wrist_coord[1]) > 300 and self.performed_pushup:
                self.rep_count += 1
                self.performed_pushup = False
                logger.info(f"Pushup rep completed: {self.rep_count}")
        except:
            pass
    
    def add_info_overlay(self, image):
        """Add pushup-specific info overlay"""
        super().add_info_overlay(image)
        
        # Add pushup form indicator
        if self.performed_pushup and 0 in self.idx_to_coordinates:
            cv2.putText(image, "DOWN", 
                       (self.idx_to_coordinates[0][0] - 30, self.idx_to_coordinates[0][1] - 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    def reset(self):
        """Reset pushup tracking stats"""
        super().reset()
        self.performed_pushup = False