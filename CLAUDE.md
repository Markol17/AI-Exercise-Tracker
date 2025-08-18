# Vero Wellness — POC Blueprint

## Objective

Deliver a working **single-camera** proof of concept on a MacBook Pro M3 (webcam) that provides:

- **Multi-person tracking**
- **Pose-based exercise recognition & rep counting**
- **Basic identity enrollment & re-identification** (with explicit consent)
- **Weight tracking** for each set
- A **TypeScript API using oRPC** (backed by **Drizzle + Postgres**) for end-to-end type safety with a **React Native/Expo** mobile app

The design must evolve cleanly to **multi-camera** and **sensor-augmented** production.

## Scope

### In (POC)

- Single webcam input on macOS (Apple Silicon).
- Real-time multi-person detection, tracking, and pose estimation.
- Initial exercise recognition for a small, clear set (for example, a lower-body and an upper-body movement).
- Rep counting via robust, rule-based temporal logic.
- Identity enrollment (photo-based with consent) and basic matching.
- Weight tracking: primary via mobile input; optional vision-assist later.
- Type-safe API boundary using oRPC; persistence via Drizzle + Postgres.
- Mobile app flows for onboarding, session control, weight entry, and history.

### Out (later)

- Multi-camera fusion and cross-camera ID handoff.
- Hardware machine sensors (BLE/load cells) as ground truth for weights.
- Large exercise catalog with advanced temporal models.
- Full production privacy, security, and compliance hardening.

## High-Level Architecture

- **Perception Service (Python):** Runs on the MacBook, processes webcam frames, produces person tracks, keypoints, exercise/reps, optional identity matches, and optional weight hints; emits structured events to the server.
- **TypeScript Server (oRPC + Drizzle + Postgres):** Validates and persists events; exposes strongly typed procedures to the mobile app; pushes realtime updates via WebSockets or an equivalent channel.
- **Mobile App (React Native/Expo):** Uses the typed API to manage members and sessions, displays live rep/exercise/weight info, and records weights and other metadata from the user.

Information flows one way from **Perception → Server** (ingest endpoint) and bidirectionally between **Mobile ↔ Server** (oRPC + realtime).

## Component Responsibilities

### Perception (Python)

- **Capture:** Single webcam stream with stable frame rate and timestamping.
- **Per-frame analysis:** Person detection, tracking, and pose keypoints.
- **Temporal analysis:** Exercise recognition and rep counting per tracked person.
- **Identity:** Enrollment happens outside the stream; when a face is visible, attempt a match at conservative thresholds; provide confidence indicators.
- **Weight assist (optional):** Vision-assist for weight readings when feasible; readings marked as low-confidence hints.
- **Event emission:** Emit structured events such as rep increments, set boundaries, exercise state changes, identity matches, and optional zone presence; include confidence and timing metadata.
- **Resilience:** Queue events and retry on transient network issues; local logging with basic metrics.

### TypeScript Server (oRPC + Drizzle + Postgres)

- **Contracts:** Central, versioned shared types for all client/server data.
- **oRPC:** Strongly typed procedures for member management, session lifecycle, queries, and admin/health.
- **Ingestion:** Validates incoming perception events; ensures idempotency and consistent timestamps; persists to Postgres via Drizzle.
- **Realtime:** Broadcasts new events to subscribed clients for live UI updates.
- **Data lifecycle:** Migrations for schema evolution; retention guidelines for event data; roll-ups for summaries in future phases.
- **Security (POC level):** Minimal protection for ingestion (for example, a shared secret), CORS configuration for mobile development, and a clear pathway to stronger auth later.

### Mobile (React Native/Expo)

- **Onboarding & consent:** Capture photos, accept terms, and trigger identity enrollment via the API.
- **Sessions:** Start/stop sessions; subscribe to realtime event streams; show live exercise and rep counts; offer quick weight entry tied to sets.
- **History:** Browsable session and event history; basic summaries and personal records.
- **Reliability:** Offline tolerance for user inputs with replay; configurable server base URL for device or simulator.

## Data & Contracts (Conceptual)

This blueprint intentionally avoids concrete schemas. Define the following domain concepts and evolve them with explicit versioning:

- **Core entities:** Member, Session, Event.
- **Events as source of truth:** Rep increments, set boundaries, exercise classification changes, optional identity matches, optional zone changes, and optional weight annotations.
- **Versioning:** Append-only evolution of event types and exercise vocabularies to preserve historical analytics.
- **Confidence & provenance:** Optional confidence and source details (perception vs user input vs sensor) to support later reconciliation.

## API Surface (Conceptual)

- **oRPC procedures:** Typed flows for member management, session lifecycle, lookups, and listing historical data with pagination.
- **Ingestion endpoint:** Receives perception-generated events; validates against shared contracts; assigns authoritative timestamps when necessary.
- **Realtime channel(s):** Session- and/or member-scoped subscriptions that stream newly persisted events to clients.

The exact names, routes, and payload shapes are left to implementation; only these capabilities are required in the POC.

## Weight Tracking (POC Strategy)

- **Primary path:** Mobile app collects weight per set through a fast numeric UI for reliability during the POC.
- **Assistive path (optional):** Perception attempts vision-based reading when a console or pin stack is clearly visible; such readings are flagged as low-confidence.
- **Association:** Weight entries bind to relevant set boundaries; late edits are permitted in the mobile UI to correct mistakes.

## Identity, Consent, and Privacy

- **Consent first:** Identity enrollment requires explicit opt-in with clear purposes and retention terms.
- **Embeddings handling:** Treat face embeddings as sensitive; secure in transit and at rest; avoid unnecessary retention.
- **Controls:** Provide opt-out and deletion pathways; ensure visibility of what’s being recorded.
- **POC guardrails:** Minimal viable controls now, with a defined path to comprehensive policies and technical enforcement later.

## Observability & Operational Health

- **Perception metrics:** Frame rate, per-stage latency, active tracks, rep detection rates, identity match attempt rates.
- **Server metrics:** Request latencies, ingestion acceptance/rejection rates, database write/read rates, realtime connection counts.
- **Mobile indicators:** Realtime connection status, last event timestamp, basic error reporting for API calls.
- **Logs:** Structured, human-readable logs with correlation identifiers; severity levels and sampling guidance.

## Performance Targets (POC)

- **Throughput:** Sustained real-time processing at or above a practical frame rate on the MacBook M3 webcam.
- **Accuracy:** Rep counting within a tight tolerance for the initial exercises; conservative identity matches with minimal false positives.
- **Latency:** End-to-end time from detection to mobile UI update within a responsive budget on a local network.

## Testing Approach

- **Perception:** Unit tests for geometric and temporal logic; small “golden” clips for regression; stability testing under motion and occlusion.
- **Server:** Contract validation for ingestion; type-level checks for oRPC procedures; schema evolution tests; realtime broadcast smoke tests.
- **Mobile:** Unit tests for state and formatting; a basic end-to-end flow for onboarding, live session, weight entry, and history.

## c (Non-prescriptive)

- **Perception:** All Python perception components **must run inside an Anaconda (conda) environment** for easier development and reproducibility; suited for Apple Silicon with an appropriate deep-learning framework, a pose-capable detector, tracking, and optional OCR; local configuration for camera index and frame rate.
- **Server:** TypeScript runtime with oRPC, Drizzle, and Postgres connectivity; local configuration for database and ingestion authentication.
- **Mobile:** React Native/Expo TypeScript project with typed client generation from shared contracts and a minimal navigation structure.
- **Shared:** Single source of truth for domain contracts and enums used by both server and mobile, with explicit versioning.

## Risks & Mitigations

- **Occlusion & mirrors:** Favor camera angles that minimize self-occlusion; start with exercises that present clear joint motion.
- **Identity reliability:** Keep thresholds conservative; allow manual correction flows; permit unassigned sessions when uncertain.
- **Weight timing:** Define clear set segmentation to anchor weight association; allow post-hoc edits in the app.
- **Complexity creep:** Keep the exercise catalog minimal for the POC; prioritize stability and clarity in event semantics.

## Evolution Path (Post-POC)

- **Multi-camera:** Calibration, cross-camera handoff, floor-plane mapping, and multi-target multi-camera tracking; preserve event contracts.
- **Sensors:** Integrate BLE or load-cell inputs for weight ground truth; reconcile multiple sources using confidence and priority rules.
- **Scale & deploy:** Move perception to edge nodes; host the server in a managed environment; implement comprehensive authentication/authorization, rate limits, and observability.
- **Analytics:** Build roll-ups for session summaries, personal records, and trends; add coach/admin dashboards.

## Milestones & Acceptance (Descriptive)

- **Milestones:**
  - Initial end-to-end skeleton with event flow and minimal UI.
  - Reliable real-time tracking and rep counting for selected exercises.
  - Identity enrollment and a successful re-identification during a session.
  - Weight capture via mobile bound to set completions.
  - Realtime updates reflected in the mobile UI; persisted histories load correctly.
- **Acceptance:** A live demo with two people in frame showing separate rep counts; a successful identity match for a consented member; weight recorded and visible in history; smooth live updates; data durably stored in Postgres.

## Environment Variables (Descriptive)

- **Database connection** for Postgres.
- **Ingestion authentication** for the perception-to-server path.
- **API base URLs** for mobile and perception clients.
- **Realtime endpoint** for event subscriptions.
- **Logging level** and optional feature flags.

## Definition of Done (POC)

A single-camera session where multiple participants are tracked concurrently; the app displays real-time exercise and reps per participant; at least one participant is matched post-enrollment; weights are captured and shown in history; the system maintains type safety across mobile and server via oRPC; all data is persisted in Postgres through Drizzle-managed tables; and the design clearly indicates how it will scale to multi-camera and sensor-augmented production.
