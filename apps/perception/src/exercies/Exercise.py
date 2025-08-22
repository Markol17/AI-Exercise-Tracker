import asyncio
from typing import Optional


class Exercise:
    def __init__(self):
        self.session_id: Optional[str] = None
        self.enable_webrtc: bool = False

    def set_session_config(self, session_id: str = None, enable_webrtc: bool = False):
        """Configure session settings for WebRTC streaming"""
        self.session_id = session_id
        self.enable_webrtc = enable_webrtc

    def exercise(self):
        raise NotImplementedError("dispatch to subclass")

    async def exercise_async(self):
        """Async version for WebRTC integration"""
        raise NotImplementedError("dispatch to subclass")
