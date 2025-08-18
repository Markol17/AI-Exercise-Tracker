import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactQueryApiClient } from '@vero/api';

// Members API hooks
export function useMembers() {
	return useQuery(reactQueryApiClient.members.list.queryOptions({}));
}

export function useCreateMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.create.mutationOptions({
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
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

// Sessions API hooks
export function useCreateSession() {
	return useMutation(reactQueryApiClient.sessions.create.mutationOptions({}));
}

export function useEndSession() {
	return useMutation(reactQueryApiClient.sessions.end.mutationOptions({}));
}

export function useSessionEvents(sessionId: string, enabled = true) {
	return useQuery({
		...reactQueryApiClient.sessions.getSessionEvents.queryOptions({
			input: {
				sessionId,
				limit: 100,
				offset: 0,
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
			onSuccess: (_: any, variables: any) => {
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
			onSuccess: (_: any, variables: any) => {
				queryClient.invalidateQueries({
					queryKey: ['sessions', variables.sessionId, 'events'],
				});
			},
		})
	);
}
