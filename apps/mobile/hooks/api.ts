import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useORPCClient } from '../providers/QueryProvider';

// Members API hooks
export function useMembers() {
	const client = useORPCClient();

	return useQuery({
		queryKey: ['members', 'list'],
		queryFn: async () => {
			const response = await client.members.list({});
			return response.items;
		},
	});
}

export function useCreateMember() {
	const client = useORPCClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { name: string; email?: string }) => {
			return await client.members.create(input);
		},
		onSuccess: () => {
			// Invalidate members list to refetch after creating
			queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
		},
	});
}

export function useEnrollMember() {
	const client = useORPCClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { memberId: string; imageData: string }) => {
			return await client.members.enrollIdentity({
				memberId: input.memberId,
				photoData: input.imageData,
				consent: true,
			});
		},
		onSuccess: () => {
			// Invalidate members list to show updated enrollment status
			queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
		},
	});
}

// Sessions API hooks
export function useCreateSession() {
	const client = useORPCClient();

	return useMutation({
		mutationFn: async (input: { memberId: string }) => {
			return await client.sessions.create(input);
		},
	});
}

export function useEndSession() {
	const client = useORPCClient();

	return useMutation({
		mutationFn: async (input: { sessionId: string }) => {
			return await client.sessions.end(input);
		},
	});
}

export function useSessionEvents(sessionId: string, enabled = true) {
	const client = useORPCClient();

	return useQuery({
		queryKey: ['sessions', sessionId, 'events'],
		queryFn: async () => {
			const response = await client.sessions.getSessionEvents({
				sessionId,
				limit: 100,
				offset: 0,
			});
			return response.items;
		},
		enabled: enabled && !!sessionId,
	});
}

// Weights API hooks
export function useRecordWeight() {
	const client = useORPCClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			sessionId: string;
			setNumber: number;
			exercise: string;
			value: number;
			unit: 'lbs' | 'kg';
			source: string;
		}) => {
			return await client.weights.record({
				value: input.value,
				sessionId: input.sessionId,
				setNumber: input.setNumber,
				exercise: input.exercise,
				unit: input.unit,
				source: input.source as 'manual' | 'vision' | 'sensor',
			});
		},
		onSuccess: (data, variables) => {
			// Invalidate session events to show the new weight record
			queryClient.invalidateQueries({
				queryKey: ['sessions', variables.sessionId, 'events'],
			});
		},
	});
}

// Events API hooks
export function useCreateEvent() {
	const client = useORPCClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { sessionId?: string; type: string; data: any; metadata?: any }) => {
			return await client.events.create({
				type: input.type,
				sessionId: input.sessionId || '',
				source: 'manual',
				metadata: input.metadata,
			});
		},
		onSuccess: (data, variables) => {
			// Invalidate session events if this event is tied to a session
			if (variables.sessionId) {
				queryClient.invalidateQueries({
					queryKey: ['sessions', variables.sessionId, 'events'],
				});
			}
		},
	});
}

// Utility hooks for query management
export function useInvalidateQueries() {
	const queryClient = useQueryClient();

	return {
		invalidateMembers: () => {
			queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
		},
		invalidateSessionEvents: (sessionId: string) => {
			queryClient.invalidateQueries({
				queryKey: ['sessions', sessionId, 'events'],
			});
		},
		invalidateAll: () => {
			queryClient.invalidateQueries();
		},
	};
}
