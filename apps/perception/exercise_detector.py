import numpy as np
from typing import Dict, Tuple, Optional
import math
from config import Config

class ExerciseDetector:
    def __init__(self):
        self.exercises = Config.EXERCISES
        
    def detect_exercise(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[str]:
        if not keypoints:
            return None
            
        for exercise_name, exercise_config in self.exercises.items():
            required_keypoints = exercise_config['keypoints']
            
            if all(kp in keypoints and keypoints[kp][2] > Config.POSE_THRESHOLD 
                   for kp in required_keypoints):
                return exercise_name
        
        return None
    
    def calculate_angle(self, p1: Tuple[float, float], 
                        p2: Tuple[float, float], 
                        p3: Tuple[float, float]) -> float:
        angle = math.degrees(
            math.atan2(p3[1] - p2[1], p3[0] - p2[0]) -
            math.atan2(p1[1] - p2[1], p1[0] - p2[0])
        )
        return abs(angle)
    
    def count_reps(self, track, keypoints: Dict[str, Tuple[float, float, float]]) -> Tuple[int, str]:
        if not track.exercise or not keypoints:
            return track.rep_count, track.rep_state
            
        exercise_config = self.exercises.get(track.exercise)
        if not exercise_config:
            return track.rep_count, track.rep_state
        
        if track.exercise == 'squat':
            angle = self._calculate_squat_angle(keypoints)
        elif track.exercise == 'bicep_curl':
            angle = self._calculate_curl_angle(keypoints)
        else:
            return track.rep_count, track.rep_state
        
        if angle is None:
            return track.rep_count, track.rep_state
        
        thresholds = exercise_config['angle_thresholds']
        
        if track.rep_state == 'neutral' or track.rep_state == 'up':
            if angle < thresholds['down']:
                track.rep_state = 'down'
        elif track.rep_state == 'down':
            if angle > thresholds['up']:
                track.rep_state = 'up'
                track.rep_count += 1
        
        track.last_angle = angle
        return track.rep_count, track.rep_state
    
    def _calculate_squat_angle(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
        try:
            left_hip = keypoints.get('left_hip')
            left_knee = keypoints.get('left_knee')
            left_ankle = keypoints.get('left_ankle')
            
            if all([left_hip, left_knee, left_ankle]):
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [left_hip, left_knee, left_ankle]):
                    return self.calculate_angle(left_hip[:2], left_knee[:2], left_ankle[:2])
            
            right_hip = keypoints.get('right_hip')
            right_knee = keypoints.get('right_knee')
            right_ankle = keypoints.get('right_ankle')
            
            if all([right_hip, right_knee, right_ankle]):
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [right_hip, right_knee, right_ankle]):
                    return self.calculate_angle(right_hip[:2], right_knee[:2], right_ankle[:2])
        except:
            pass
        
        return None
    
    def _calculate_curl_angle(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
        try:
            left_shoulder = keypoints.get('left_shoulder')
            left_elbow = keypoints.get('left_elbow')
            left_wrist = keypoints.get('left_wrist')
            
            if all([left_shoulder, left_elbow, left_wrist]):
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [left_shoulder, left_elbow, left_wrist]):
                    return self.calculate_angle(left_shoulder[:2], left_elbow[:2], left_wrist[:2])
            
            right_shoulder = keypoints.get('right_shoulder')
            right_elbow = keypoints.get('right_elbow')
            right_wrist = keypoints.get('right_wrist')
            
            if all([right_shoulder, right_elbow, right_wrist]):
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [right_shoulder, right_elbow, right_wrist]):
                    return self.calculate_angle(right_shoulder[:2], right_elbow[:2], right_wrist[:2])
        except:
            pass
        
        return None