import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import time

@dataclass
class Track:
    track_id: str
    bbox: Tuple[int, int, int, int]
    keypoints: Optional[Dict[str, Tuple[float, float, float]]]
    last_seen: float
    member_id: Optional[str] = None
    confidence: float = 0.0
    exercise: Optional[str] = None
    rep_count: int = 0
    set_number: int = 1
    last_angle: Optional[float] = None
    rep_state: str = 'neutral'

class MultiPersonTracker:
    def __init__(self, max_lost_frames: int = 30):
        self.tracks: Dict[str, Track] = {}
        self.next_track_id = 1
        self.max_lost_frames = max_lost_frames
        self.frame_count = 0
        
    def update(self, detections: List[Tuple[Tuple[int, int, int, int], Optional[Dict]]]) -> List[Track]:
        current_time = time.time()
        updated_tracks = []
        matched_detections = set()
        
        for track_id, track in list(self.tracks.items()):
            best_match = None
            best_iou = 0.0
            
            for i, (bbox, keypoints) in enumerate(detections):
                if i in matched_detections:
                    continue
                    
                iou = self._calculate_iou(track.bbox, bbox)
                if iou > best_iou and iou > 0.3:
                    best_iou = iou
                    best_match = i
            
            if best_match is not None:
                bbox, keypoints = detections[best_match]
                track.bbox = bbox
                track.keypoints = keypoints
                track.last_seen = current_time
                track.confidence = min(track.confidence + 0.1, 1.0)
                matched_detections.add(best_match)
                updated_tracks.append(track)
            else:
                frames_lost = (current_time - track.last_seen) * 30
                if frames_lost > self.max_lost_frames:
                    del self.tracks[track_id]
                else:
                    track.confidence = max(track.confidence - 0.1, 0.0)
                    updated_tracks.append(track)
        
        for i, (bbox, keypoints) in enumerate(detections):
            if i not in matched_detections:
                track_id = f"track_{self.next_track_id}"
                self.next_track_id += 1
                
                new_track = Track(
                    track_id=track_id,
                    bbox=bbox,
                    keypoints=keypoints,
                    last_seen=current_time,
                    confidence=0.5
                )
                
                self.tracks[track_id] = new_track
                updated_tracks.append(new_track)
        
        self.frame_count += 1
        return updated_tracks
    
    def _calculate_iou(self, bbox1: Tuple[int, int, int, int], 
                       bbox2: Tuple[int, int, int, int]) -> float:
        x1_min, y1_min, x1_max, y1_max = bbox1
        x2_min, y2_min, x2_max, y2_max = bbox2
        
        x_intersection = max(0, min(x1_max, x2_max) - max(x1_min, x2_min))
        y_intersection = max(0, min(y1_max, y2_max) - max(y1_min, y2_min))
        
        intersection_area = x_intersection * y_intersection
        
        area1 = (x1_max - x1_min) * (y1_max - y1_min)
        area2 = (x2_max - x2_min) * (y2_max - y2_min)
        
        union_area = area1 + area2 - intersection_area
        
        if union_area == 0:
            return 0.0
        
        return intersection_area / union_area
    
    def get_active_tracks(self) -> List[Track]:
        return list(self.tracks.values())