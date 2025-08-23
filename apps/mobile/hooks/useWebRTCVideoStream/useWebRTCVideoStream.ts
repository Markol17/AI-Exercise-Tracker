import { useEffect, useRef, useState } from 'react';
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
	const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

	const pcRef = useRef<RTCPeerConnection | null>(null);
	const peerConnectionConfig = {
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
	};

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
		onOpen: () => {
			if (sessionId) {
				const registerMessage = {
					type: 'register',
					sessionId,
					role: 'mobile',
				};
				sendJsonMessage(registerMessage);
			}
		},
		onClose: () => {
			stopVideoStream();
		},
		onError: (error) => {
			console.error('WebSocket error:', error);
			stopVideoStream();
		},
	});

	// Register as mobile client when WebSocket connects
	// useEffect(() => {
	// 	if (readyState === ReadyState.OPEN && sessionId && !isRegistered.current) {
	// 		const registerMessage = {
	// 			type: 'register',
	// 			sessionId,
	// 			role: 'mobile',
	// 		};
	// 		sendJsonMessage(registerMessage);
	// 		isRegistered.current = true;
	// 	}

	// 	// Reset registration flag when disconnected
	// 	if (readyState !== ReadyState.OPEN) {
	// 		isRegistered.current = false;
	// 	}
	// }, [readyState, sessionId, sendJsonMessage]);

	const sendSignaling = (type: string, data: any) => {
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

	const initializePeerConnection = () => {
		stopPeerConnection();

		const peerConnection = new RTCPeerConnection(peerConnectionConfig);
		pcRef.current = peerConnection;

		// Add transceiver for receiving video
		peerConnection.addTransceiver('video', { direction: 'recvonly' });

		// Handle connection state changes
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		peerConnection.addEventListener('connectionstatechange', () => {
			const state = peerConnection.connectionState;
			setConnectionState(state);

			if (state === 'disconnected' || state === 'failed') {
				setRemoteStream(null);
			}
		});

		// Handle ICE candidates
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		peerConnection.addEventListener('icecandidate', (event: any) => {
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
		peerConnection.addEventListener('track', (event: any) => {
			if (event.streams && event.streams[0]) {
				setRemoteStream(event.streams[0]);
			}
		});

		// Also listen for addstream as fallback
		// @ts-expect-error https://github.com/react-native-webrtc/react-native-webrtc/issues/1700#issue-3038071935
		peerConnection.addEventListener('addstream', (event: any) => {
			if (event.stream) {
				setRemoteStream(event.stream);
			}
		});

		return peerConnection;
	};

	const handleSignaling = async (signaling: any) => {
		const { type, data } = signaling;

		try {
			if (type === 'offer') {
				const pc = initializePeerConnection();

				try {
					const offer = new RTCSessionDescription(data);
					await pc.setRemoteDescription(offer);

					if (pc.signalingState === 'have-remote-offer') {
						const answer = await pc.createAnswer();
						await pc.setLocalDescription(answer);

						sendSignaling('answer', {
							type: answer.type,
							sdp: answer.sdp,
						});
					} else {
						console.error(`Cannot create answer, signaling state is: ${pc.signalingState}`);
					}
				} catch (error) {
					console.error('Error handling offer:', error);
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
					console.log('Added ICE candidate to peer connection');
				} else {
					console.warn('Received ICE candidate but no remote description set yet');
				}
			}
		} catch (error) {
			console.error(`Error handling ${type} signaling:`, error);
		}
	};

	const stopPeerConnection = () => {
		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}
	};

	const stopVideoStream = () => {
		stopPeerConnection();
		setRemoteStream(null);
		setConnectionState('new');
	};

	useEffect(() => {
		return () => {
			stopPeerConnection();
		};
	}, []);

	return {
		remoteStream,
		connectionState,
		stopVideoStream,
		webSocketState: readyState,
		isWebSocketConnected: readyState === ReadyState.OPEN,
	};
}
