import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { type MediaStream, RTCView } from 'react-native-webrtc';

interface VideoStreamProps {
	stream: MediaStream;
	style?: ViewStyle;
	objectFit?: 'contain' | 'cover';
	mirror?: boolean;
}

export function VideoStream({ stream, style, objectFit = 'cover', mirror = false }: VideoStreamProps) {
	if (!stream) {
		return null;
	}

	return <RTCView streamURL={stream.toURL()} style={[styles.video, style]} objectFit={objectFit} mirror={mirror} />;
}

const styles = StyleSheet.create({
	video: {
		flex: 1,
		backgroundColor: '#000',
	},
});
