import { Stack } from 'expo-router';

export default function RootLayout() {
	return (
		<Stack>
			<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
			<Stack.Screen name='enrollment/[memberId]' options={{ title: 'Enroll Identity' }} />
			<Stack.Screen name='weight-entry' options={{ title: 'Enter Weight' }} />
		</Stack>
	);
}
