import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientType, reactQueryApiClient } from '@vero/api';

// Members API hooks
export function useMembers() {
	return useQuery(
		reactQueryApiClient.members.list.queryOptions({
			context: {
				type: ClientType.WS,
			},
		})
	);
}

export function useCreateMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.create.mutationOptions({
			context: {
				type: ClientType.REST,
			},
			onSuccess: () => {
				// Invalidate members list to refetch after creating
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

export function useEnrollMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.enrollIdentity.mutationOptions({
			context: {
				type: ClientType.REST,
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

// Sessions API hooks
export function useCreateSession() {
	return useMutation(
		reactQueryApiClient.sessions.create.mutationOptions({
			context: {
				type: ClientType.REST,
			},
		})
	);
}

export function useEndSession() {
	return useMutation(
		reactQueryApiClient.sessions.end.mutationOptions({
			context: {
				type: ClientType.REST,
			},
		})
	);
}

export function useSessionEvents(sessionId: string, enabled = true) {
	return useQuery({
		...reactQueryApiClient.sessions.getSessionEvents.queryOptions({
			input: {
				sessionId,
				limit: 100,
				offset: 0,
			},
			context: {
				type: ClientType.REST,
			},
		}),
		enabled: enabled && !!sessionId,
	});
}

// Weights API hooks
export function useRecordWeight() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.weights.record.mutationOptions({
			context: {
				type: ClientType.REST,
			},
			onSuccess: (_, variables) => {
				// Invalidate session events to show the new weight record
				queryClient.invalidateQueries({
					queryKey: ['sessions', variables.sessionId, 'events'],
				});
			},
		})
	);
}

// Events API hooks
export function useCreateEvent() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.events.create.mutationOptions({
			context: {
				type: ClientType.REST,
			},
			onSuccess: (_, variables) => {
				queryClient.invalidateQueries({
					queryKey: ['sessions', variables.sessionId, 'events'],
				});
			},
		})
	);
}
