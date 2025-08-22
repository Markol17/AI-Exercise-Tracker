"""
Exercise classes for WebRTC perception app
"""

from src.exercies.Squat import Squat
from src.exercies.Plank import Plank
from src.exercies.Pushup import Pushup
from src.exercies.Lunges import Lunges
from src.exercies.ShoulderTap import ShoulderTap

# Map exercise names to classes
EXERCISE_CLASSES = {
    'squat': Squat,
    'plank': Plank,
    'pushup': Pushup,
    'lunges': Lunges,
    'shouldertap': ShoulderTap,
}


def get_exercise_processor(exercise_type: str):
    """
    Factory function to get the appropriate exercise processor
    Falls back to Squat if exercise type not found
    """
    exercise_class = EXERCISE_CLASSES.get(exercise_type.lower())
    if exercise_class:
        return exercise_class()
    else:
        # Fallback to squat for now
        print(f"Warning: Exercise '{exercise_type}' not implemented yet, using Squat")
        return Squat()