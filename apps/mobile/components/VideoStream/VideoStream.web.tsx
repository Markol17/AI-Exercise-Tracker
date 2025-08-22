import React, { useEffect, useRef } from 'react';

interface VideoStreamProps {
	stream: MediaStream | null;
	objectFit?: 'contain' | 'cover';
	mirror?: boolean;
}

export function VideoStream({ stream, objectFit = 'cover', mirror = false }: VideoStreamProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
			videoRef.current.play().catch(console.error);
		}
	}, [stream]);

	if (!stream) {
		return null;
	}

	const videoStyle: React.CSSProperties = {
		width: '100%',
		height: '300px',
		backgroundColor: '#000',
		borderRadius: '8px',
		objectFit: objectFit,
		transform: mirror ? 'scaleX(-1)' : 'none',
	};

	return <video ref={videoRef} style={videoStyle} autoPlay playsInline muted />;
}
