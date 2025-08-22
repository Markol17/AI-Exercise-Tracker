import asyncio

import mediapipe as mp
from src.exercies.Exercise import Exercise
from src.ThreadedCamera import ThreadedCamera
from src.utils import *
from src.webrtc_streamer import cleanup_webrtc_streaming, init_webrtc_streaming
from src.websocket_client import ws_client

mp_drawing = mp.solutions.drawing_utils
mp_holistic = mp.solutions.holistic
mp_pose = mp.solutions.pose

pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
pose_landmark_drawing_spec = mp_drawing.DrawingSpec(
    thickness=5, circle_radius=2, color=(0, 0, 255)
)
pose_connection_drawing_spec = mp_drawing.DrawingSpec(
    thickness=1, circle_radius=1, color=(0, 255, 0)
)
PRESENCE_THRESHOLD = 0.5
VISIBILITY_THRESHOLD = 0.5
performedPushUp = False


class Pushup(Exercise):
    def __init__(self):
        super().__init__()

    def exercise(self):
        """Synchronous exercise method for backwards compatibility"""
        # Run async version in sync context
        asyncio.run(self.exercise_async())

    async def exercise_async(self):
        threaded_camera = ThreadedCamera()
        # Create regular window with fixed size
        cv2.namedWindow("Image", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Image", 1280, 720)
        scount = 0
        last_sent_count = -1

        # Connect to WebSocket server
        ws_client.connect()

        # Initialize WebRTC streaming if enabled
        webrtc_streamer = None
        if self.enable_webrtc and self.session_id:
            print(f"🎥 Starting WebRTC streaming for session {self.session_id}")
            webrtc_streamer = await init_webrtc_streaming(
                self.session_id, threaded_camera
            )
            if webrtc_streamer:
                print("✅ WebRTC streaming initialized successfully")
            else:
                print("❌ Failed to initialize WebRTC streaming")
        while True:
            success, image = threaded_camera.show_frame()
            if not success or image is None:
                continue
            image = cv2.flip(image, 1)
            image_orig = cv2.flip(image, 1)
            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                mp_holistic.POSE_CONNECTIONS,
                landmark_drawing_spec=pose_landmark_drawing_spec,
                connection_drawing_spec=pose_connection_drawing_spec,
            )
            idx_to_coordinates = get_idx_to_coordinates(image, results)
            try:
                # shoulder - ankle - wrist
                if (
                    12 in idx_to_coordinates
                    and 28 in idx_to_coordinates
                    and 16 in idx_to_coordinates
                ):  # left side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[12]),
                        (idx_to_coordinates[28]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[28]),
                        (idx_to_coordinates[16]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[12], idx_to_coordinates[28], 100
                    )
                    l2 = np.linspace(
                        idx_to_coordinates[28], idx_to_coordinates[16], 100
                    )
                    eang1 = ang(
                        (idx_to_coordinates[12], idx_to_coordinates[28]),
                        (idx_to_coordinates[28], idx_to_coordinates[16]),
                    )
                    cv2.putText(
                        image,
                        str(round(eang1, 2)),
                        (idx_to_coordinates[28]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)

                else:  # right side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[11]),
                        (idx_to_coordinates[27]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[27]),
                        (idx_to_coordinates[15]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[11], idx_to_coordinates[27], 100
                    )
                    l2 = np.linspace(
                        idx_to_coordinates[27], idx_to_coordinates[16], 100
                    )
                    eang1 = ang(
                        (idx_to_coordinates[11], idx_to_coordinates[27]),
                        (idx_to_coordinates[27], idx_to_coordinates[15]),
                    )
                    cv2.putText(
                        image,
                        str(round(eang1, 2)),
                        (idx_to_coordinates[27]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
            except:
                pass

            try:
                # shoulder - Elbow - wrist
                if (
                    12 in idx_to_coordinates
                    and 14 in idx_to_coordinates
                    and 16 in idx_to_coordinates
                ):  # left side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[12]),
                        (idx_to_coordinates[14]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[14]),
                        (idx_to_coordinates[16]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[12], idx_to_coordinates[14], 100
                    )
                    l2 = np.linspace(
                        idx_to_coordinates[14], idx_to_coordinates[16], 100
                    )
                    ang1 = ang(
                        (idx_to_coordinates[12], idx_to_coordinates[14]),
                        (idx_to_coordinates[14], idx_to_coordinates[16]),
                    )
                    cv2.putText(
                        image,
                        "   " + str(round(ang1, 2)),
                        (idx_to_coordinates[14]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)

                else:  # right side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[11]),
                        (idx_to_coordinates[13]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[13]),
                        (idx_to_coordinates[15]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[11], idx_to_coordinates[13], 100
                    )
                    l2 = np.linspace(
                        idx_to_coordinates[13], idx_to_coordinates[16], 100
                    )
                    eang1 = ang(
                        (idx_to_coordinates[11], idx_to_coordinates[13]),
                        (idx_to_coordinates[13], idx_to_coordinates[15]),
                    )
                    cv2.putText(
                        image,
                        str(round(eang1, 2)),
                        (idx_to_coordinates[13]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)

            except:
                pass

            try:
                # elbow - wrist - horizontal ground
                if (
                    14 in idx_to_coordinates and 16 in idx_to_coordinates
                ):  # left side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[14]),
                        (idx_to_coordinates[16]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[16]),
                        (idx_to_coordinates[16][0] + 80, idx_to_coordinates[16][1]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[14], idx_to_coordinates[16], 100
                    )
                    temp = (idx_to_coordinates[16][0] + 80, idx_to_coordinates[16][1])
                    l2 = np.linspace(idx_to_coordinates[16], temp, 100)
                    ang1 = ang(
                        (idx_to_coordinates[14], idx_to_coordinates[16]),
                        (idx_to_coordinates[16], temp),
                    )
                    cv2.putText(
                        image,
                        "   " + str(round(ang1, 2)),
                        (idx_to_coordinates[16]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)
                else:  # right side of body
                    cv2.line(
                        image,
                        (idx_to_coordinates[13]),
                        (idx_to_coordinates[15]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    cv2.line(
                        image,
                        (idx_to_coordinates[15]),
                        (idx_to_coordinates[15][0] + 80, idx_to_coordinates[15][1]),
                        thickness=4,
                        color=(255, 0, 255),
                    )
                    l1 = np.linspace(
                        idx_to_coordinates[14], idx_to_coordinates[15], 100
                    )
                    temp = (idx_to_coordinates[15][0] + 80, idx_to_coordinates[15][1])
                    l2 = np.linspace(idx_to_coordinates[15], temp, 100)
                    ang1 = ang(
                        (idx_to_coordinates[14], idx_to_coordinates[15]),
                        (idx_to_coordinates[15], temp),
                    )
                    cv2.putText(
                        image,
                        "   " + str(round(ang1, 2)),
                        (idx_to_coordinates[15]),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2,
                    )
                    center, radius, start_angle, end_angle = convert_arc(
                        l1[80], l2[20], sagitta=15
                    )
                    axes = (radius, radius)
                    draw_ellipse(image, center, axes, -1, start_angle, end_angle, 255)

            except:
                pass

            try:
                # Count Number of Pushups
                if 12 in idx_to_coordinates:
                    shoulder_coord = idx_to_coordinates[12]
                else:
                    shoulder_coord = idx_to_coordinates[11]

                if 16 in idx_to_coordinates:
                    ankle_coord = idx_to_coordinates[16]
                else:
                    ankle_coord = idx_to_coordinates[15]

                if abs(shoulder_coord[1] - ankle_coord[1]) < 300:
                    performedPushUp = True
                if abs(shoulder_coord[1] - ankle_coord[1]) > 300 and performedPushUp:
                    scount += 1
                    performedPushUp = False

                    # Send real-time rep count to mobile app
                    if scount != last_sent_count:
                        ws_client.send_rep_count("pushup", scount)
                        last_sent_count = scount
                        print(f"📱 Sent pushup count: {scount}")

            except:
                pass
            if 0 in idx_to_coordinates:
                cv2.putText(
                    image,
                    "Count : " + str(scount),
                    (idx_to_coordinates[0][0] - 60, idx_to_coordinates[0][1] - 140),
                    fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                    fontScale=0.9,
                    color=(0, 0, 0),
                    thickness=2,
                )
            cv2.imshow("Image", rescale_frame(image, percent=100))
            if cv2.waitKey(5) & 0xFF == 27:
                break

        # Cleanup
        pose.close()

        # Clean up WebRTC streaming
        if webrtc_streamer:
            print("🛑 Cleaning up WebRTC streaming")
            await cleanup_webrtc_streaming()
