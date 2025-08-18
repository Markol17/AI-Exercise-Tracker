// Auth package will use better-auth
// TODO: Implement better-auth configuration and exports

export interface AuthUser {
	id: string;
	email?: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthSession {
	id: string;
	userId: string;
	expiresAt: Date;
	createdAt: Date;
}

// Placeholder for better-auth exports
// Will be implemented when better-auth is integrated
