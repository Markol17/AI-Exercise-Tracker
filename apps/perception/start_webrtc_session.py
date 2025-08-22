#!/usr/bin/env python3
"""
Convenience script to start a WebRTC-enabled perception session.
This script helps users easily start the perception app with WebRTC streaming enabled.
"""

import argparse
import subprocess
import sys
import uuid
from datetime import datetime


def generate_session_id():
    """Generate a unique session ID"""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"session-{timestamp}-{short_uuid}"


def main():
    parser = argparse.ArgumentParser(
        description="Start Vero Perception with WebRTC streaming",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start pushup tracking with WebRTC
  python start_webrtc_session.py pushup
  
  # Start with custom session ID
  python start_webrtc_session.py squat --session-id my-session-123
  
  # Interactive mode with WebRTC
  python start_webrtc_session.py
        """,
    )

    parser.add_argument(
        "exercise",
        nargs="?",
        choices=["pushup", "squat", "plank", "shouldertap", "lunges"],
        help="Exercise type (optional - will use interactive mode if not provided)",
    )

    parser.add_argument(
        "--session-id",
        help="Custom session ID (auto-generated if not provided)",
        default=None,
    )

    parser.add_argument(
        "--no-webrtc",
        action="store_true",
        help="Disable WebRTC streaming (for testing)",
    )

    args = parser.parse_args()

    # Generate session ID if not provided
    session_id = args.session_id or generate_session_id()

    # Build command arguments
    cmd_args = ["python", "main.py"]

    if args.exercise:
        cmd_args.extend(["--type", args.exercise])

    cmd_args.extend(["--session-id", session_id])

    if not args.no_webrtc:
        cmd_args.append("--enable-webrtc")

    # Print session information
    print("🎥 Starting Vero Perception with WebRTC Streaming")
    print("=" * 50)
    print(f"📋 Session ID: {session_id}")
    print(f"🏋️  Exercise: {args.exercise or 'Interactive Mode'}")
    print(f"📡 WebRTC: {'Enabled' if not args.no_webrtc else 'Disabled'}")
    print("=" * 50)
    print()

    if not args.no_webrtc:
        print("📱 Instructions for Mobile App:")
        print(f"   1. Open the mobile app")
        print(f"   2. Start a live session")
        print(f"   3. The session ID will be auto-generated: {session_id}")
        print(f"   4. Video stream should appear automatically")
        print()

    print("🚀 Starting perception app...")
    print(f"Command: {' '.join(cmd_args)}")
    print()

    try:
        # Start the perception app
        subprocess.run(cmd_args, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Stopping perception app...")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running perception app: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
