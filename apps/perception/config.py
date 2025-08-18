import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
    WS_URL = os.getenv('WS_URL', 'ws://localhost:3001')
    INGESTION_SECRET = os.getenv('INGESTION_SECRET', '')
    
    CAMERA_INDEX = int(os.getenv('CAMERA_INDEX', '0'))
    FRAME_RATE = int(os.getenv('FRAME_RATE', '30'))
    
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.5'))
    IDENTITY_THRESHOLD = float(os.getenv('IDENTITY_THRESHOLD', '0.85'))
    POSE_THRESHOLD = float(os.getenv('POSE_THRESHOLD', '0.5'))
    
    YOLO_MODEL = 'yolov8n.pt'
    
    EXERCISES = {
        'squat': {
            'keypoints': ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
            'angle_thresholds': {
                'down': 90,
                'up': 150
            }
        },
        'bicep_curl': {
            'keypoints': ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
            'angle_thresholds': {
                'down': 40,
                'up': 140
            }
        }
    }
    
    POSE_CONNECTIONS = [
        ('left_shoulder', 'left_elbow'),
        ('left_elbow', 'left_wrist'),
        ('right_shoulder', 'right_elbow'),
        ('right_elbow', 'right_wrist'),
        ('left_shoulder', 'left_hip'),
        ('right_shoulder', 'right_hip'),
        ('left_hip', 'left_knee'),
        ('left_knee', 'left_ankle'),
        ('right_hip', 'right_knee'),
        ('right_knee', 'right_ankle'),
        ('left_shoulder', 'right_shoulder'),
        ('left_hip', 'right_hip')
    ]