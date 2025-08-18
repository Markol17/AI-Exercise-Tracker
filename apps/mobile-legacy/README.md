# Vero Wellness Mobile App

React Native mobile application built with Expo Router and TypeScript.

## Features

- **File-based Routing**: Uses Expo Router for clean, structured navigation
- **Type-safe API**: Integrated with oRPC + TanStack Query for end-to-end type safety
- **Modern State Management**: TanStack Query for server state, Zustand for local state
- **Offline-first**: Built-in caching and optimistic updates

## Architecture

### Navigation Structure

```
app/
├── _layout.tsx              # Root layout with providers
├── (tabs)/                  # Tab navigation group
│   ├── _layout.tsx         # Tab bar configuration
│   ├── index.tsx           # Home tab (/)
│   ├── members.tsx         # Members tab (/members)
│   ├── session.tsx         # Session tab (/session)
│   └── history.tsx         # History tab (/history)
├── enrollment/
│   └── [memberId].tsx      # Dynamic route (/enrollment/123)
└── weight-entry.tsx        # Modal route (/weight-entry)
```

### API Integration

The app uses the shared oRPC client from `@vero/api` with TanStack Query for type-safe API calls:

```typescript
// Custom hooks for API operations
const { data: members, isLoading } = useMembers();
const createMemberMutation = useCreateMember();

// Usage
await createMemberMutation.mutateAsync({ name: 'John Doe' });
```

### Key Components

- **QueryProvider**: Sets up React Query client and creates typed API client from `@vero/api`
- **API Hooks**: Type-safe wrappers around shared oRPC client calls
- **Stores**: Zustand stores for local state management

## Development

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator

### Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run start

# Run on specific platform
npm run ios
npm run android
```

### API Configuration

The app connects to the oRPC server at:

- Development: `http://localhost:3000/api`
- Production: Set `EXPO_PUBLIC_API_URL` environment variable

### Type Safety

All API calls are fully typed through the oRPC integration:

```typescript
// These calls are type-checked at compile time
const member = await client.members.create({ name: 'John' });
const session = await client.sessions.create({ memberId: member.id });
const events = await client.sessions.getSessionEvents({ sessionId: session.id });
```

## API Hooks

### Members

- `useMembers()` - Fetch all members
- `useCreateMember()` - Create a new member
- `useEnrollMember()` - Enroll member identity

### Sessions

- `useCreateSession()` - Start a new session
- `useEndSession()` - End current session
- `useSessionEvents()` - Fetch session events

### Weights

- `useRecordWeight()` - Record weight measurement

### Events

- `useCreateEvent()` - Create custom events

## Caching Strategy

TanStack Query provides intelligent caching:

- **Stale Time**: 5 minutes for queries
- **Retry Logic**: 3 retries with exponential backoff
- **Automatic Invalidation**: Related queries update when mutations succeed

## Future Enhancements

- [ ] Offline support with background sync
- [ ] Real-time updates via WebSocket integration
- [ ] Camera integration for member enrollment
- [ ] Exercise form detection and feedback
- [ ] Data visualization and analytics
