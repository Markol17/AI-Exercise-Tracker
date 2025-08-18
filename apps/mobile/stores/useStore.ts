import type { Member, Session, VeroEvent } from '@vero/api/types/core';
import { create } from 'zustand';

interface AppState {
	currentSession: Session | null;
	currentMember: Member | null;
	events: VeroEvent[];
	wsConnected: boolean;

	setCurrentSession: (session: Session | null) => void;
	setCurrentMember: (member: Member | null) => void;
	addEvent: (event: VeroEvent) => void;
	clearEvents: () => void;
	setWsConnected: (connected: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
	currentSession: null,
	currentMember: null,
	events: [],
	wsConnected: false,

	setCurrentSession: (session) => set({ currentSession: session }),
	setCurrentMember: (member) => set({ currentMember: member }),
	addEvent: (event) =>
		set((state) => ({
			events: [...state.events, event],
		})),
	clearEvents: () => set({ events: [] }),
	setWsConnected: (connected) => set({ wsConnected: connected }),
}));
