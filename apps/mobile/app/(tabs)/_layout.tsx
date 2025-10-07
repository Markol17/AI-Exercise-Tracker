import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: true,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: 'absolute',
					},
					default: {},
				}),
			}}>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					headerTitle: 'AI Exercise Tracker',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
				}}
			/>
			<Tabs.Screen
				name='members'
				options={{
					title: 'Members',
					headerTitle: 'Members',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='person.2' color={color} />,
				}}
			/>

			<Tabs.Screen
				name='history'
				options={{
					title: 'History',
					headerTitle: 'History',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='clock' color={color} />,
				}}
			/>
		</Tabs>
	);
}
