import numpy as np
from typing import Dict, Tuple, Optional, List
import math
from config import Config
import logging

logger = logging.getLogger(__name__)

class ExerciseDetector:
    def __init__(self):
        self.exercises = Config.EXERCISES
        self.angle_history_size = 5  # Keep history of angles for smoothing
        
    def detect_exercise(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[str]:
        """
        Detect which exercise is being performed based on visible keypoints.
        Returns the most likely exercise type or None.
        """
        if not keypoints:
            return None
        
        best_exercise = None
        best_score = 0.0
        
        for exercise_name, exercise_config in self.exercises.items():
            required_keypoints = exercise_config['keypoints']
            
            # Calculate visibility score for this exercise
            visible_count = 0
            total_confidence = 0.0
            missing_keypoints = []
            
            for kp_name in required_keypoints:
                if kp_name in keypoints:
                    conf = keypoints[kp_name][2]
                    if conf > Config.POSE_THRESHOLD:
                        visible_count += 1
                        total_confidence += conf
                    else:
                        missing_keypoints.append(f"{kp_name}(conf={conf:.2f})")
                else:
                    missing_keypoints.append(f"{kp_name}(not detected)")
            
            # Score based on percentage of required keypoints visible and their confidence
            if visible_count > 0:
                visibility_score = visible_count / len(required_keypoints)
                confidence_score = total_confidence / visible_count
                overall_score = visibility_score * confidence_score
                
                # Log debug info for squat detection
                if exercise_name == 'squat' and visibility_score >= 0.5:
                    logger.debug(f"Squat detection: visible={visible_count}/{len(required_keypoints)}, "
                               f"visibility_score={visibility_score:.2f}, confidence_score={confidence_score:.2f}, "
                               f"overall_score={overall_score:.2f}")
                    if missing_keypoints:
                        logger.debug(f"Missing keypoints for squat: {', '.join(missing_keypoints)}")
                
                if overall_score > best_score and visibility_score >= 0.7:  # At least 70% of keypoints visible
                    best_score = overall_score
                    best_exercise = exercise_name
        
        return best_exercise
    
    def calculate_angle(self, p1: Tuple[float, float], 
                        p2: Tuple[float, float], 
                        p3: Tuple[float, float]) -> float:
        """
        Calculate the angle between three points.
        p2 is the vertex of the angle.
        Returns angle in degrees (0-180).
        """
        # Calculate vectors
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        
        # Calculate angle using dot product
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)
        
        return np.degrees(angle)
    
    def count_reps(self, track, keypoints: Dict[str, Tuple[float, float, float]]) -> Tuple[int, str]:
        """
        Count repetitions for the current exercise.
        Returns updated rep count and current rep state.
        """
        if not track.exercise or not keypoints:
            return track.rep_count, track.rep_state
            
        exercise_config = self.exercises.get(track.exercise)
        if not exercise_config:
            return track.rep_count, track.rep_state
        
        # Calculate angle based on exercise type
        if track.exercise == 'squat':
            angle = self._calculate_squat_angle(keypoints)
        elif track.exercise == 'bicep_curl':
            angle = self._calculate_curl_angle(keypoints)
        else:
            return track.rep_count, track.rep_state
        
        if angle is None:
            return track.rep_count, track.rep_state
        
        # Smooth angle using history
        if not hasattr(track, 'angle_history'):
            track.angle_history = []
        
        track.angle_history.append(angle)
        if len(track.angle_history) > self.angle_history_size:
            track.angle_history.pop(0)
        
        # Use smoothed angle (average of recent angles)
        smoothed_angle = np.mean(track.angle_history)
        
        # Get thresholds
        thresholds = exercise_config['angle_thresholds']
        down_threshold = thresholds['down']
        up_threshold = thresholds['up']
        
        # Add hysteresis to prevent false transitions
        hysteresis = 5  # degrees
        
        # State machine for rep counting with hysteresis
        if track.rep_state == 'neutral' or track.rep_state == 'up':
            if smoothed_angle < (down_threshold + hysteresis):
                track.rep_state = 'down'
                track.lowest_angle = smoothed_angle
                logger.debug(f"{track.track_id}: Going down - angle {smoothed_angle:.1f}°")
        
        elif track.rep_state == 'down':
            # Track the lowest angle reached
            if hasattr(track, 'lowest_angle'):
                track.lowest_angle = min(track.lowest_angle, smoothed_angle)
            
            if smoothed_angle > (up_threshold - hysteresis):
                # Validate the rep quality
                if hasattr(track, 'lowest_angle') and track.lowest_angle < down_threshold:
                    track.rep_state = 'up'
                    track.rep_count += 1
                    logger.info(f"{track.track_id}: Rep {track.rep_count} completed - "
                              f"lowest angle {track.lowest_angle:.1f}°")
                else:
                    # Rep didn't go deep enough
                    track.rep_state = 'up'
                    logger.debug(f"{track.track_id}: Incomplete rep - "
                               f"lowest angle {track.lowest_angle:.1f}° > {down_threshold}°")
        
        # Store current angle for visualization
        track.last_angle = smoothed_angle
        
        return track.rep_count, track.rep_state
    
    def _calculate_squat_angle(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
        """
        Calculate the knee angle for squat detection.
        Uses the angle between hip-knee-ankle.
        """
        angles = []
        
        # Try both legs
        for side in ['left', 'right']:
            hip = keypoints.get(f'{side}_hip')
            knee = keypoints.get(f'{side}_knee')
            ankle = keypoints.get(f'{side}_ankle')
            
            if all([hip, knee, ankle]):
                # Check confidence thresholds
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [hip, knee, ankle]):
                    angle = self.calculate_angle(hip[:2], knee[:2], ankle[:2])
                    angles.append(angle)
                    logger.debug(f"Squat angle for {side} leg: {angle:.1f}° "
                               f"(hip conf={hip[2]:.2f}, knee conf={knee[2]:.2f}, ankle conf={ankle[2]:.2f})")
                else:
                    logger.debug(f"Low confidence for {side} leg squat keypoints: "
                               f"hip={hip[2] if hip else 0:.2f}, "
                               f"knee={knee[2] if knee else 0:.2f}, "
                               f"ankle={ankle[2] if ankle else 0:.2f}")
            else:
                missing = []
                if not hip: missing.append(f'{side}_hip')
                if not knee: missing.append(f'{side}_knee')
                if not ankle: missing.append(f'{side}_ankle')
                if missing:
                    logger.debug(f"Missing keypoints for squat angle: {', '.join(missing)}")
        
        # Return average of both legs if available, otherwise single leg
        if angles:
            avg_angle = np.mean(angles)
            logger.debug(f"Squat angle (avg of {len(angles)} leg(s)): {avg_angle:.1f}°")
            return avg_angle
        
        logger.debug("Could not calculate squat angle - no valid leg keypoints")
        return None
    
    def _calculate_curl_angle(self, keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
        """
        Calculate the elbow angle for bicep curl detection.
        Uses the angle between shoulder-elbow-wrist.
        """
        angles = []
        
        # Try both arms
        for side in ['left', 'right']:
            shoulder = keypoints.get(f'{side}_shoulder')
            elbow = keypoints.get(f'{side}_elbow')
            wrist = keypoints.get(f'{side}_wrist')
            
            if all([shoulder, elbow, wrist]):
                # Check confidence thresholds
                if all(kp[2] > Config.POSE_THRESHOLD for kp in [shoulder, elbow, wrist]):
                    angle = self.calculate_angle(shoulder[:2], elbow[:2], wrist[:2])
                    angles.append(angle)
        
        # For bicep curls, typically one arm at a time, so take minimum angle
        # (the arm that's actually doing the curl)
        if angles:
            return min(angles)
        
        return None
    
    def get_exercise_feedback(self, track, angle: float) -> str:
        """
        Provide feedback on exercise form based on current angle.
        """
        if not track.exercise or angle is None:
            return ""
        
        exercise_config = self.exercises.get(track.exercise)
        if not exercise_config:
            return ""
        
        thresholds = exercise_config['angle_thresholds']
        
        if track.exercise == 'squat':
            if angle < thresholds['down'] - 20:
                return "Too deep!"
            elif angle < thresholds['down']:
                return "Good depth"
            elif angle < thresholds['up']:
                return "Go deeper"
            else:
                return "Starting position"
        
        elif track.exercise == 'bicep_curl':
            if angle < thresholds['down']:
                return "Full contraction"
            elif angle < thresholds['down'] + 30:
                return "Good curl"
            elif angle < thresholds['up']:
                return "Keep curling"
            else:
                return "Arms extended"
        
        return ""
    
    def reset_exercise(self, track):
        """Reset exercise state for a track."""
        track.exercise = None
        track.rep_count = 0
        track.rep_state = 'neutral'
        track.set_number = 1
        track.last_angle = None
        if hasattr(track, 'angle_history'):
            track.angle_history = []
        if hasattr(track, 'lowest_angle'):
            delattr(track, 'lowest_angle')