import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
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
			// No ICE servers needed for local network connections
			iceServers: [],
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

	// Send WebRTC signaling message - use ref to avoid recreating
	const sendSignalingRef = useRef<(type: string, data: any) => void>();
	
	useEffect(() => {
		sendSignalingRef.current = (type: string, data: any) => {
			const message = {
				type: 'webrtc_signaling',
				targetRole: 'perception',
				signaling: {
					type,
					data,
				},
			};
			sendJsonMessage(message);
		};
	}, [sendJsonMessage]);

	// Stable sendSignaling function that won't cause re-renders  
	const sendSignaling = useCallback((type: string, data: any) => {
		sendSignalingRef.current?.(type, data);
	}, []);

	// Initialize peer connection
	const initializePeerConnection = useCallback(() => {
		if (pcRef.current) {
			pcRef.current.close();
		}

		const pc = new RTCPeerConnection(pcConfig);
		pcRef.current = pc;

		// Add transceiver for receiving video
		pc.addTransceiver('video', { direction: 'recvonly' });

		// Handle connection state changes
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		pc.addEventListener('connectionstatechange', () => {
			const state = pc.connectionState;
			setConnectionState(state);

			if (state === 'connected') {
				setIsStreaming(true);
			} else if (state === 'disconnected' || state === 'failed') {
				setIsStreaming(false);
				setRemoteStream(null);
			}
		});

		// Handle ICE candidates
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		pc.addEventListener('icecandidate', (event: any) => {
			if (event.candidate) {
				sendSignaling('ice-candidate', {
					candidate: event.candidate.candidate,
					sdpMid: event.candidate.sdpMid,
					sdpMLineIndex: event.candidate.sdpMLineIndex,
				});
			}
		});

		// Handle remote stream - try both track and addstream events
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		pc.addEventListener('track', (event: any) => {
			if (event.streams && event.streams[0]) {
				setRemoteStream(event.streams[0]);
				setIsStreaming(true);
			}
		});

		// Also listen for addstream as fallback
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		pc.addEventListener('addstream', (event: any) => {
			if (event.stream) {
				setRemoteStream(event.stream);
				setIsStreaming(true);
			}
		});

		return pc;
	}, [pcConfig]); // Remove sendSignaling from deps since it's now stable

	// Handle incoming signaling messages
	const handleSignaling = useCallback(
		async (signaling: any) => {
			const { type, data } = signaling;

			try {
				if (type === 'offer') {
					// Close any existing connection
					if (pcRef.current) {
						pcRef.current.close();
						pcRef.current = null;
						setRemoteStream(null);
						setIsStreaming(false);
					}

					// Create new peer connection for this offer
					const pc = initializePeerConnection();
					
					try {
						// Set remote description
						const offer = new RTCSessionDescription(data);
						await pc.setRemoteDescription(offer);

						// Check state before creating answer
						if (pc.signalingState === 'have-remote-offer') {
							// Create and send answer
							const answer = await pc.createAnswer();
							await pc.setLocalDescription(answer);

							sendSignaling('answer', {
								type: answer.type,
								sdp: answer.sdp,
							});
						} else {
							console.error(`Cannot create answer, signaling state is: ${pc.signalingState}`);
						}
					} catch (err) {
						console.error('Error handling offer:', err);
						// Clean up on error
						if (pcRef.current) {
							pcRef.current.close();
							pcRef.current = null;
						}
					}
				} else if (type === 'ice-candidate') {
					// Add ICE candidate
					if (pcRef.current && pcRef.current.remoteDescription) {
						const candidate = new RTCIceCandidate({
							candidate: data.candidate,
							sdpMid: data.sdpMid,
							sdpMLineIndex: data.sdpMLineIndex,
						});
						await pcRef.current.addIceCandidate(candidate);
						console.log('🧊 Added ICE candidate');
					} else {
						console.warn('⚠️ Received ICE candidate but no remote description set yet');
					}
				}
			} catch (error) {
				console.error(`Error handling ${type} signaling:`, error);
			}
		},
		[initializePeerConnection, sendSignaling] // Both are now stable
	);

	// Register as mobile client when WebSocket connects
	useEffect(() => {
		if (readyState === ReadyState.OPEN && sessionId && !isRegistered.current) {
			const registerMessage = {
				type: 'register',
				sessionId,
				role: 'mobile',
			};
			sendJsonMessage(registerMessage);
			isRegistered.current = true;
		}

		// Reset registration flag when disconnected
		if (readyState !== ReadyState.OPEN) {
			isRegistered.current = false;
		}
	}, [readyState, sessionId, sendJsonMessage]);

	// Start video stream request
	const startVideoStream = useCallback(() => {
		// This function is kept for compatibility but doesn't need to do anything
		// The connection is established when we receive an offer from perception
	}, []);

	// Stop video stream
	const stopVideoStream = useCallback(() => {
		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}
		setRemoteStream(null);
		setIsStreaming(false);
		setConnectionState('new');
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Clean up peer connection on unmount
			if (pcRef.current) {
				pcRef.current.close();
				pcRef.current = null;
			}
		};
	}, []); // No dependencies - only run on unmount

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
