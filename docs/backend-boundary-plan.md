# Backend Boundary Plan

## Decision

Serenity remains a single Next.js application for now.

The goal of SER-34 is not to split services. The goal is to prepare clear backend boundaries inside the monolith so a future split can happen without changing product behavior.

## Why Serenity Stays Monolithic Now

- The operating model is still being stabilized across admin, provider, center, carer, review, closing and export.
- Server actions let us move quickly while the product language and workflows are still changing.
- A single auth/session layer reduces risk while role boundaries are still being validated.
- Prisma schema changes are still frequent; a separate backend would add migration and deploy overhead too early.
- The current Dokploy deployment is simpler and safer as one Next.js app plus PostgreSQL.

The split should happen only after the domain service layer is stable enough to expose API contracts without rewriting each workflow twice.

## Future Backend Domains

| Domain | Owns | Current app surface | Future boundary |
| --- | --- | --- | --- |
| Auth and access | login, session, roles, throttling | `/login`, `src/lib/auth.ts`, `src/lib/security.ts` | `auth service` or `/api/auth/*` |
| Admin setup | provider network setup, centers, sites, patients, carers, workflows | `/admin`, `src/app/admin/actions.ts`, `src/lib/admin-data.ts` | `admin service` or `/api/admin/*` |
| Provider operations | service requests, visits, assignment, replacement, coordination notes | `/providers`, `src/app/providers/actions.ts`, `src/lib/providers-data.ts` | `provider operations service` or `/api/provider/*` |
| Center portal | center scoped demand, request creation, center visibility | `/centers`, `src/app/centers/actions.ts`, `src/lib/centers-data.ts` | `center service` or `/api/center/*` |
| Carer execution | availability, credentials, visit execution, checklist, evidence, incidents | `/carers`, `src/app/carers/actions.ts`, `src/lib/carers-data.ts` | `carer service` or `/api/carer/*` |
| Review and care records | review decisions, approval/rejection rules, care record validation | provider order detail, `reviewVisit`, visit state helpers | `review service` or `/api/review/*` |
| Closing and export | closing periods, settlements, expenses, export packages, export jobs | `/providers/closing`, `/providers/export`, export routes, `src/lib/export-connectors.ts` | `closing/export service` or `/api/closing/*`, `/api/export/*` |
| Audit | critical event logging and scoped audit reads | `src/lib/audit.ts`, `src/lib/audit-data.ts` | `audit service` or `/api/audit/*` |

## Current Server Actions To Move Behind Boundaries

### Auth

- `src/app/login/actions.ts`
  - `loginAction`
- `src/app/auth/actions.ts`
  - `logoutAction`

### Admin

- `src/app/admin/actions.ts`
  - `createClientCenter`
  - `createCareRecipient`
  - `createClientSite`
  - `createCareTeamMember`
  - `updateCarerCredentialStatus`

### Provider Operations

- `src/app/providers/actions.ts`
  - `createServiceOrder`
  - `updateServiceOrder`
  - `createVisitForOrder`
  - `assignCarerToVisit`
  - `requestVisitReplacement`
  - `logOperationalEscalation`
  - `updateVisitStatus`

### Review

- `src/app/providers/actions.ts`
  - `reviewVisit`

### Closing and Export

- `src/app/providers/actions.ts`
  - `saveVisitSettlement`
  - `addVisitExpense`
  - `updateClosingPeriodStatus`
  - `syncClosingPeriodExternally`
  - `processClosingPeriodSync`
  - `runClosingPeriodSyncQueue`
  - `checkClosingPeriodSyncQueue`
  - `retryClosingPeriodSync`
  - `resolveClosingPeriodSync`
  - `checkClosingPeriodSync`
- `src/app/providers/closing/export/[id]/route.ts`
- `src/app/api/internal/export-jobs/run/route.ts`

### Center

- `src/app/centers/actions.ts`
  - `createCenterServiceOrder`

### Carer

- `src/app/carers/actions.ts`
  - `updateCarerAvailabilityProfile`
  - `addCarerAvailabilityBlock`
  - `deleteCarerAvailabilityBlock`
  - `saveCarerCredential`
  - `updateCarerVisitStatus`
  - `saveVisitChecklistItem`
  - `addVisitEvidence`
  - `reportVisitIncident`

## Current Prisma Data Functions To Move Behind Boundaries

### Admin

- `src/lib/admin-data.ts`
  - `getAdminWorkspace`

### Provider

- `src/lib/providers-data.ts`
  - `listProviderOrders`
  - `listProviderCarers`
  - `getProviderOrder`
  - `getProviderMetrics`
  - `listProviderActionQueue`
  - `getProviderOrderFormData`
  - `syncServiceOrderStatus`

### Center

- `src/lib/centers-data.ts`
  - `listCenterOrders`
  - `getCenterPortalData`
  - `getCenterOrder`
  - `getCenterMetrics`
  - `getCenterOrderFormData`
  - `createCenterOrderCode`
  - `syncServiceOrderStatus`

### Carer

- `src/lib/carers-data.ts`
  - `getCarerWorkspace`

### Closing and Export

- `src/lib/providers-data.ts`
  - `getProviderClosingWorkspace`
  - `getClosingExportPackage`
  - `serializeClosingExportCsv`
  - `createClosingExportJob`
  - `processClosingExportJob`
  - `retryClosingExportJob`
  - `acknowledgeClosingExportJob`
  - `checkClosingExportJobStatus`
  - `runQueuedClosingExportJobs`
  - `runScheduledClosingExportCycle`
  - `runSentClosingExportChecks`
- `src/lib/export-connectors.ts`
  - `executeConnector`
  - `checkConnectorStatus`

### Shared Domain Utilities

- `src/lib/auth.ts`
- `src/lib/security.ts`
- `src/lib/audit.ts`
- `src/lib/audit-data.ts`
- `src/lib/availability.ts`
- `src/lib/visit-state.ts`
- `src/lib/catalogs.ts`
- `src/lib/prisma.ts`

## Target Internal Shape

Before adding public API endpoints, create a service layer with this shape:

```text
src/server/
  auth/
  admin/
  provider/
  center/
  carer/
  review/
  closing/
  export/
  audit/
  shared/
```

Each domain should expose use-case functions that accept typed input and an explicit actor context:

```ts
type ActorContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
};
```

Server actions should become thin adapters:

1. read `FormData`,
2. require session,
3. call a service function,
4. revalidate/redirect.

Prisma should be imported only by service/data modules, not UI components.

## Migration Path To API Endpoints

### Phase 1: Internal service layer

- Move business rules out of `src/app/*/actions.ts`.
- Keep server actions as the UI transport.
- Introduce typed input/output objects for each use case.
- Keep Prisma inside service/data modules.

### Phase 2: API route adapters

- Add `/api/*` routes that call the same service functions used by server actions.
- Keep server actions for forms until UI migration is worth the cost.
- Add route-level validation, auth and scoped error responses.

### Phase 3: Frontend transport switch

- Move interactive clients from server actions to API calls where needed.
- Keep server-rendered reads using service/data functions while pages remain in Next.
- Add contract tests for API request/response shapes.

### Phase 4: Physical split only if needed

- Extract a backend service only when there is a real operational reason:
  - mobile app needs stable API contracts,
  - background jobs need independent scaling,
  - external integrations require separate runtime,
  - frontend velocity needs independent deploys.

## API Contract Principles

- Endpoints map to use cases, not database tables.
- Every endpoint requires actor context and enforces role/scope.
- External clients never receive provider-wide data unless the actor scope permits it.
- Audit logging stays inside service functions, not UI adapters.
- Errors should be stable enough for UI and future mobile clients.

## What SER-34 Does Not Do

- It does not split the repo.
- It does not create a second backend container.
- It does not replace server actions yet.
- It does not introduce a new auth provider.
- It does not change database schema.

## Next Implementation Candidate

The first code refactor should be provider operations because `src/app/providers/actions.ts` is the largest mixed boundary.

Recommended first slice:

1. `assignCarerToVisit`
2. `updateVisitStatus`
3. `reviewVisit`
4. shared visit transition and audit behavior

That slice gives high value because it touches assignment, execution, review and closing eligibility without changing the UI.
