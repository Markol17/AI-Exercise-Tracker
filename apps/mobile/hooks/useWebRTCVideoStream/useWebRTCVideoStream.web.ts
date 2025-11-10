// Web version using browser native WebRTC APIs
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

interface WebRTCVideoStreamProps {
	sessionId: string;
}

export function useWebRTCVideoStream({ sessionId }: WebRTCVideoStreamProps) {
	if (!process.env.EXPO_PUBLIC_WS_URL) {
		throw new Error('EXPO_PUBLIC_WS_URL is not set');
	}

	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const [connectionState, setConnectionState] = useState<string>('new');
	const [isStreaming, setIsStreaming] = useState<boolean>(false);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const isRegistered = useRef<boolean>(false);

	const pcConfig = useMemo(
		() => ({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
		}),
		[]
	);

	const { readyState, sendJsonMessage } = useWebSocket(process.env.EXPO_PUBLIC_WS_URL, {
		share: true,
		onMessage: (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'client_registered' && data.role === 'perception') {
					console.log('🎥 Perception app connected, ready for WebRTC');
				}

				if (data.type === 'webrtc_signaling' && data.fromRole === 'perception') {
					handleSignaling(data.signaling);
				}
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
			}
		},
	});

	const sendSignaling = useCallback(
		(type: string, data: any) => {
			const message = {
				type: 'webrtc_signaling',
				targetRole: 'perception',
				signaling: {
					type,
					data,
				},
			};
			sendJsonMessage(message);
			console.log(`📡 Sent ${type} signaling`);
		},
		[sendJsonMessage]
	);

	const initializePeerConnection = useCallback(() => {
		if (pcRef.current) {
			pcRef.current.close();
		}

		const pc = new RTCPeerConnection(pcConfig);
		pcRef.current = pc;

		pc.onconnectionstatechange = () => {
			const state = pc.connectionState;
			setConnectionState(state);
			console.log(`🔄 WebRTC connection state: ${state}`);

			if (state === 'connected') {
				setIsStreaming(true);
				console.log('✅ WebRTC connection established');
			} else if (state === 'disconnected' || state === 'failed') {
				setIsStreaming(false);
				setRemoteStream(null);
			}
		};

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				sendSignaling('ice-candidate', {
					candidate: event.candidate.candidate,
					sdpMid: event.candidate.sdpMid,
					sdpMLineIndex: event.candidate.sdpMLineIndex,
				});
			}
		};

		pc.ontrack = (event) => {
			console.log('📺 Received remote video track');
			if (event.streams && event.streams[0]) {
				setRemoteStream(event.streams[0]);
				setIsStreaming(true);
			}
		};

		return pc;
	}, [pcConfig, sendSignaling]);

	const handleSignaling = useCallback(
		async (signaling: any) => {
			const { type, data } = signaling;
			console.log(`📨 Received ${type} signaling`);

			try {
				if (type === 'offer') {
					if (!pcRef.current) {
						initializePeerConnection();
					}

					const pc = pcRef.current!;

					const offer = new RTCSessionDescription(data);
					await pc.setRemoteDescription(offer);

					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);

					sendSignaling('answer', {
						type: answer.type,
						sdp: answer.sdp,
					});

					console.log('✅ Sent answer to perception app');
				} else if (type === 'ice-candidate') {
					if (pcRef.current) {
						const candidate = new RTCIceCandidate({
							candidate: data.candidate,
							sdpMid: data.sdpMid,
							sdpMLineIndex: data.sdpMLineIndex,
						});
						await pcRef.current.addIceCandidate(candidate);
						console.log('🧊 Added ICE candidate');
					}
				}
			} catch (error) {
				console.error(`Error handling ${type} signaling:`, error);
			}
		},
		[sendSignaling, initializePeerConnection]
	);

	useEffect(() => {
		if (readyState === ReadyState.OPEN && sessionId && !isRegistered.current) {
			const registerMessage = {
				type: 'register',
				sessionId,
				role: 'mobile',
			};
			sendJsonMessage(registerMessage);
			isRegistered.current = true;
			console.log(`📱 Registered as web client for session ${sessionId}`);
		}

		if (readyState !== ReadyState.OPEN) {
			isRegistered.current = false;
		}
	}, [readyState, sessionId, sendJsonMessage]);

	const startVideoStream = useCallback(() => {
		if (readyState === ReadyState.OPEN && isRegistered.current) {
			initializePeerConnection();
			console.log('🎥 Requesting video stream from perception app (web)');
		} else {
			console.warn('Cannot start stream: WebSocket not connected or not registered');
		}
	}, [readyState, initializePeerConnection]);

	const stopVideoStream = useCallback(() => {
		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}
		setRemoteStream(null);
		setIsStreaming(false);
		setConnectionState('new');
		console.log('🛑 Stopped video stream (web)');
	}, []);

	useEffect(() => {
		return () => {
			stopVideoStream();
		};
	}, [stopVideoStream]);

	return {
		remoteStream,
		connectionState,
		isStreaming,
		startVideoStream,
		stopVideoStream,
		webSocketState: readyState,
		isWebSocketConnected: readyState === ReadyState.OPEN,
	};
}
