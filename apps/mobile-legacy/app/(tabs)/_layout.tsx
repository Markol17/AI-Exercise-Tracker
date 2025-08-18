import { Tabs } from 'expo-router';

export default function TabLayout() {
	return (
		<Tabs>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: () => null, // Add your icon here
				}}
			/>
			<Tabs.Screen
				name='members'
				options={{
					title: 'Members',
					tabBarIcon: () => null, // Add your icon here
				}}
			/>
			<Tabs.Screen
				name='session'
				options={{
					title: 'Session',
					tabBarIcon: () => null, // Add your icon here
				}}
			/>
			<Tabs.Screen
				name='history'
				options={{
					title: 'History',
					tabBarIcon: () => null, // Add your icon here
				}}
			/>
		</Tabs>
	);
}
