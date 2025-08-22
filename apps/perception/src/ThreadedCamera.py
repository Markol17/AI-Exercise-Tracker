import time
from threading import Thread

import cv2


class ThreadedCamera:
    def __init__(self):
        self.capture = cv2.VideoCapture(0)
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 2)
        # FPS = 1/X
        # X = desired FPS
        self.FPS = 1 / 60
        self.FPS_MS = int(self.FPS * 1000)

        # Start frame retrieval thread
        self.thread = Thread(target=self.update, args=())
        self.frame = None
        self.thread.daemon = True
        self.running = True

    def start(self):
        """Start the camera thread"""
        if not self.thread.is_alive():
            self.thread.start()

    def update(self):
        while self.running:
            try:
                if self.capture and self.capture.isOpened():
                    (self.status, self.frame) = self.capture.read()
                time.sleep(self.FPS)
            except Exception as e:
                print(f"Error in camera update loop: {e}")
                break

    def show_frame(self):
        """Return current frame"""
        if self.frame is not None:
            return True, self.frame
        return False, None

    def stop(self):
        """Stop the camera thread"""
        # Signal thread to stop
        self.running = False

        # Wait for thread to finish (with timeout)
        if self.thread.is_alive():
            self.thread.join(timeout=2.0)

        # Release capture after thread has stopped
        if self.capture and self.capture.isOpened():
            self.capture.release()
            self.capture = None

        # Clear frame reference
        self.frame = None
