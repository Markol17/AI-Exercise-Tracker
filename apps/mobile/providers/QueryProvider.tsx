import { createORPCReactQueryUtils, RouterUtils } from '@orpc/react-query';
import { RouterClient } from '@vero/api/orpc';
import { api as orpcClient } from '@vero/api/orpc/react/client';
import { AppRouter } from '@vero/api/router/root';
import React, { createContext, useContext, useState } from 'react';

type ORPCReactUtils = RouterUtils<RouterClient<AppRouter>>;
const ORPCContext = createContext<ORPCReactUtils | undefined>(undefined);

export function useORPCClient() {
	const context = useContext(ORPCContext);
	if (!context) {
		throw new Error('useORPCClient must be used within a QueryProvider');
	}
	return context;
}

// Provider component that sets up React Query and oRPC
export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [orpc] = useState(() => createORPCReactQueryUtils(orpcClient));

	return <ORPCContext.Provider value={orpc}>{children}</ORPCContext.Provider>;
}
