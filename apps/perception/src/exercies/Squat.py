"""
Squat exercise detection for WebRTC streaming
Based on original-perception implementation but without GUI
"""

import cv2
import numpy as np
import logging
from src.exercies.ExerciseBase import ExerciseBase
from src.utils import ang, convert_arc, draw_ellipse

logger = logging.getLogger(__name__)


class Squat(ExerciseBase):
    """Squat exercise detection with visual overlays"""
    
    def __init__(self):
        super().__init__()
        self.performed_squat = False
        self.exercise_name = "squat"
    
    def draw_overlays(self, image, results):
        """Draw squat-specific visual overlays"""
        idx = self.idx_to_coordinates
        
        try:
            # Draw knee angles for right leg
            if 24 in idx and 26 in idx and 28 in idx:
                l1 = np.linspace(idx[24], idx[26], 100)
                l2 = np.linspace(idx[26], idx[28], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                ang1 = ang((idx[24], idx[26]), (idx[26], idx[28]))
                cv2.putText(image, str(round(ang1, 2)), idx[26],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[90], l2[10], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
            
            # Draw knee angles for left leg
            if 23 in idx and 25 in idx and 27 in idx:
                l1 = np.linspace(idx[23], idx[25], 100)
                l2 = np.linspace(idx[25], idx[27], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                ang2 = ang((idx[23], idx[25]), (idx[25], idx[27]))
                cv2.putText(image, str(round(ang2, 2)), idx[25],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[90], l2[10], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
        except:
            pass
        
        try:
            # Draw elbow angles (for form checking)
            if 12 in idx and 14 in idx and 16 in idx:
                l1 = np.linspace(idx[12], idx[14], 100)
                l2 = np.linspace(idx[14], idx[16], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                eang1 = ang((idx[12], idx[14]), (idx[14], idx[16]))
                cv2.putText(image, str(round(eang1, 2)), idx[14],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
            
            if 11 in idx and 13 in idx and 15 in idx:
                l1 = np.linspace(idx[11], idx[13], 100)
                l2 = np.linspace(idx[13], idx[15], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                eang2 = ang((idx[11], idx[13]), (idx[13], idx[15]))
                cv2.putText(image, str(round(eang2, 2)), idx[13],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[80], l2[20], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
        except:
            pass
        
        try:
            # Draw back angle
            if 12 in idx and 24 in idx and 26 in idx:
                l1 = np.linspace(idx[12], idx[24], 100)
                l2 = np.linspace(idx[24], idx[26], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                bang1 = ang((idx[12], idx[24]), (idx[24], idx[26]))
                cv2.putText(image, str(round(bang1, 2)), idx[24],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[90], l2[10], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
            elif 11 in idx and 23 in idx and 25 in idx:
                l1 = np.linspace(idx[11], idx[23], 100)
                l2 = np.linspace(idx[23], idx[25], 100)
                cv2.line(image, (int(l1[99][0]), int(l1[99][1])), (int(l1[69][0]), int(l1[69][1])), 
                        thickness=4, color=(0, 0, 255))
                cv2.line(image, (int(l2[0][0]), int(l2[0][1])), (int(l2[30][0]), int(l2[30][1])), 
                        thickness=4, color=(0, 0, 255))
                
                bang2 = ang((idx[11], idx[23]), (idx[23], idx[25]))
                cv2.putText(image, str(round(bang2, 2)), idx[23],
                           fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                           fontScale=0.6, color=(0, 255, 0), thickness=2)
                
                center, radius, start_angle, end_angle = convert_arc(l1[90], l2[10], sagitta=15)
                axes = (radius, radius)
                draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
        except:
            pass
        
        # Draw squat depth indicator
        try:
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
        except:
            pass
    
    def track_exercise(self, landmarks):
        """Track squat reps based on hip-knee distance"""
        idx = self.idx_to_coordinates
        
        try:
            # Use available hip and knee coordinates
            if 24 in idx:
                hip_coord = idx[24]
            elif 23 in idx:
                hip_coord = idx[23]
            else:
                return
            
            if 26 in idx:
                knee_coord = idx[26]
            elif 25 in idx:
                knee_coord = idx[25]
            else:
                return
            
            # Check if in squat position (hip close to knee level)
            if abs(hip_coord[1] - knee_coord[1]) < 35:
                self.performed_squat = True
            elif abs(hip_coord[1] - knee_coord[1]) > 35 and self.performed_squat:
                self.rep_count += 1
                self.performed_squat = False
                logger.info(f"Squat rep completed: {self.rep_count}")
        except:
            pass
    
    def add_info_overlay(self, image):
        """Add squat-specific info overlay"""
        super().add_info_overlay(image)
        
        # Add squat-specific info if in position
        if self.performed_squat and 0 in self.idx_to_coordinates:
            cv2.putText(image, "IN POSITION", 
                       (self.idx_to_coordinates[0][0] - 50, self.idx_to_coordinates[0][1] - 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    def reset(self):
        """Reset squat tracking stats"""
        super().reset()
        self.performed_squat = False