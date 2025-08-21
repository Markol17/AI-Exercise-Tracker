import argparse

from src.exercies.Lunges import Lunges
from src.exercies.Plank import Plank
from src.exercies.Pushup import Pushup
from src.exercies.ShoulderTap import ShoulderTap
from src.exercies.Squat import Squat


class GymLytics:
    def __init__(self):
        self.pushup = Pushup()
        self.plank = Plank()
        self.squat = Squat()
        self.shoulderTap = ShoulderTap()
        self.lunges = Lunges()

    def rep(self, type):
        if type.lower() == str("pushup"):
            self.pushup.exercise()
        elif type.lower() == str("squat"):
            self.squat.exercise()
        elif type.lower() == str("plank"):
            self.plank.exercise()
        elif type.lower() == str("shouldertap"):
            self.shoulderTap.exercise()
        elif type.lower() == str("lunges"):
            self.lunges.exercise()
        else:
            raise ValueError(
                f"Input {type} is not correct. \n Kindly refer to the documentation"
            )

    def interactive_exercise_selection(self):
        """Interactive exercise selection menu"""
        exercises = {
            "1": "pushup",
            "2": "squat",
            "3": "plank",
            "4": "shouldertap",
            "5": "lunges",
        }

        print("\n🏋️  Welcome to Vero Perception Fitness Tracker! 🏋️")
        print("=" * 50)
        print("Available exercises:")
        print("1. Push-ups")
        print("2. Squats")
        print("3. Plank")
        print("4. Shoulder Taps")
        print("5. Lunges")
        print("=" * 50)

        while True:
            choice = input("Select an exercise (1-5) or 'q' to quit: ").strip().lower()

            if choice == "q":
                print("Goodbye! Stay fit! 💪")
                return None
            elif choice in exercises:
                selected_exercise = exercises[choice]
                print(
                    f"\n🎯 Starting {selected_exercise.title()} tracking with live camera..."
                )
                print("Press 'q' in the camera window to stop tracking.")
                return selected_exercise
            else:
                print("❌ Invalid choice. Please select 1-5 or 'q' to quit.")


if __name__ == "__main__":
    # Set up argument parser with optional arguments
    parser = argparse.ArgumentParser(description="Vero Perception Fitness Tracker")
    parser.add_argument(
        "-type",
        "--type",
        help="Type of exercise (pushup, squat, plank, shouldertap, lunges)",
        type=str,
        default=None,
    )

    args = parser.parse_args()

    # Initialize GymLytics
    gym = GymLytics()

    # Determine exercise type
    if args.type:
        # Use command line argument if provided
        exercise_type = args.type.lower()
        print(f"🎯 Starting {exercise_type.title()} tracking with live camera...")
        gym.rep(exercise_type)
    else:
        # Interactive mode
        exercise_type = gym.interactive_exercise_selection()
        if exercise_type:
            gym.rep(exercise_type)
