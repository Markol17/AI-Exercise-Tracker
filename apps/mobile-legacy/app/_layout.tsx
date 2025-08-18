import { Stack } from 'expo-router';
import { QueryProvider } from '../../mobile/providers/QueryProvider';

export default function RootLayout() {
	return (
		<QueryProvider>
			<Stack>
				<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
				<Stack.Screen name='enrollment/[memberId]' options={{ title: 'Enroll Identity' }} />
				<Stack.Screen name='weight-entry' options={{ title: 'Enter Weight' }} />
			</Stack>
		</QueryProvider>
	);
}
