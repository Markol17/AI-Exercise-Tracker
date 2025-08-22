import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '../hooks/useColorScheme';

const queryClient = new QueryClient();

export default function RootLayout() {
	useReactQueryDevTools(queryClient);
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	});

	if (!loaded) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name='(tabs)' />
					<Stack.Screen name='+not-found' />
					<Stack.Screen
						name='exercise-selection'
						options={{
							headerShown: true,
							title: 'Select Exercise',
							headerBackTitle: 'Back',
						}}
					/>
				</Stack>
				<StatusBar style='auto' />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
