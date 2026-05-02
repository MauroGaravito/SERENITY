# Serenity Operating Model

## Decision

Serenity is an admin-first operating system for homecare coordination.

The product must not start with an order. It starts with a configured operating network:

1. provider,
2. client centers,
3. sites,
4. patients,
5. care team,
6. service workflows,
7. service requests,
8. visits,
9. care records,
10. review,
11. closing,
12. external export.

This keeps Mauricio, the provider coordinator, focused on coordination instead of building master data while under operational pressure.

## Actor Model

### Serenity Admin

Primary job: configure the operating network before service demand exists.

Owns:

- provider setup,
- client centers,
- center sites,
- center contacts,
- patients attached to sites,
- carers attached to Serenity,
- service catalog and care record expectations.

Can:

- create and update clients, sites, contacts, patients and carers,
- review service workflows,
- inspect setup readiness.

Cannot:

- be the default actor for daily coverage decisions,
- approve their own operational review unless they also hold a reviewer role,
- use closing/export as a replacement for setup.

### Provider Coordinator

Primary job: convert configured demand into covered visits.

Owns:

- service request creation,
- visit scheduling,
- carer assignment,
- coverage risk,
- replacement decisions,
- operational coordination notes.

Can:

- create service requests from configured center/site/patient data,
- add visits to an existing request,
- assign or replace carers,
- move visits through operational states before review,
- record coordination notes and escalations.

Cannot:

- create unmanaged client centers as part of a rushed order flow,
- approve or reject care records,
- treat audit trail as a working queue,
- mark a period exported without an approved export path.

### Provider Reviewer

Primary job: decide whether completed visit records are acceptable for closing.

Owns:

- review decision,
- quality feedback,
- approval/rejection reason,
- care record acceptance.

Can:

- review checklist, evidence, incidents and visit timing,
- approve a visit for closing,
- reject a visit back to correction,
- inspect audit history.

Cannot:

- modify original field evidence without traceability,
- approve a visit missing required checklist or evidence,
- use closing to bypass review.

### Center Manager

Primary job: represent the client center and its care demand.

Owns:

- center-side request context,
- patient context visible to Serenity,
- center-facing acceptance of service scope,
- monitoring of coverage and exceptions for their center.

Can:

- request service when the center portal supports it,
- monitor requests for their center,
- view coverage, incidents and approved outcomes in their scope,
- maintain center-side notes where allowed.
- create or maintain patients in their center when product policy enables it.
- request new sites or create site drafts when product policy enables approval workflow.

Cannot:

- assign carers,
- see private provider-wide carer operations,
- approve provider review,
- operate provider closing/export,
- inspect audit events outside their center scope.
- edit provider legal/contract configuration.
- directly change covered or in-progress visits; those changes must become change requests or coordination notes.

### Carer

Primary job: execute assigned visits and submit a care record.

Owns:

- profile availability,
- credentials where self-maintenance is enabled,
- visit execution,
- checklist answers,
- evidence,
- incident reports,
- visit completion notes.

Can:

- view assigned visits,
- start and complete visits,
- submit checklist and evidence,
- report incidents,
- maintain availability and credentials in their workspace.

Cannot:

- self-assign paid work,
- approve their own care record,
- edit provider settlement,
- see other carers' private operational data.

## Data Ownership Matrix

| Domain object | System owner | Creates | Updates | Reads | Approves |
| --- | --- | --- | --- | --- | --- |
| Provider organization | Admin | Admin | Admin | Admin, Coordinator, Reviewer | N/A |
| Client center | Admin | Admin | Admin | Admin, Coordinator, Reviewer, scoped Center Manager | N/A |
| Site / facility | Admin | Admin | Admin | Admin, Coordinator, Reviewer, scoped Center Manager | N/A |
| Center contact | Admin | Admin | Admin | Admin, Coordinator, scoped Center Manager | N/A |
| Patient / recipient | Admin or Center Manager by policy | Admin, Center Manager | Admin, Center Manager by policy | Admin, Coordinator, Reviewer, scoped Center Manager, assigned Carer context | N/A |
| Carer profile | Admin and Carer by policy | Admin | Admin, Carer for self-maintained fields | Admin, Coordinator, Reviewer, owner Carer | N/A |
| Credential | Admin and Carer by policy | Admin, Carer by policy | Admin, Carer by policy | Admin, Coordinator, Reviewer, owner Carer | Admin by policy |
| Availability block | Carer | Carer, Admin by exception | Carer, Admin by exception | Admin, Coordinator, owner Carer | N/A |
| Service workflow | Admin | Admin | Admin | Admin, Coordinator, Reviewer | Admin |
| Service request | Coordinator or Center Manager by policy | Coordinator, Center Manager by policy | Coordinator | Admin, Coordinator, Reviewer, scoped Center Manager | N/A |
| Visit | Coordinator | Coordinator | Coordinator, Carer for execution fields | Admin, Coordinator, Reviewer, scoped Center Manager, assigned Carer | Reviewer after completion |
| Care record | Carer | Carer | Carer until submitted, Reviewer comments after review | Coordinator, Reviewer, scoped Center Manager, assigned Carer | Reviewer |
| Incident | Carer or Coordinator | Carer, Coordinator | Coordinator, Reviewer by policy | Coordinator, Reviewer, scoped Center Manager when relevant, assigned Carer | Reviewer by implication |
| Review | Reviewer | Reviewer | Reviewer | Coordinator, Reviewer, scoped Center Manager when relevant | Reviewer |
| Closing period | Provider operations | Coordinator | Coordinator | Admin, Coordinator, Reviewer | Provider operations |
| Export job | Provider operations | Coordinator | Coordinator/system | Admin, Coordinator, Reviewer | External target acknowledgement |
| Audit event | System | System | Immutable | Role-scoped readers | N/A |

## SER-33 Center Manager Workflow Decision

Center managers are not passive viewers. In the MVP they can both create demand and monitor outcomes, but only inside their center scope.

MVP decision:

- Center managers can create service requests from configured center, site and patient data.
- Center managers monitor request status, coverage status, incidents, evidence summaries, review outcomes and scoped audit events for their own orders.
- Center managers can maintain center-side notes/contact context where enabled.
- Center managers can create or edit patient context within their center when policy enables it.
- New sites should be admin-owned in the MVP. A center may request a new site or create a draft later, but provider/admin approval is deferred.
- Request edits are direct only while a request is still early and no provider execution has started. After provider coverage is confirmed or a visit has started, center changes should become change requests or notes for coordinator handling.
- Cancellation is allowed before execution with a required reason. Once a visit is in progress or completed, the center cannot cancel directly and must request a change.

Center managers cannot:

- see provider-wide carer pool internals,
- see carer credentials, availability blocks, ratings or restriction reasons beyond the assigned visit context,
- assign or replace carers,
- approve or reject care records,
- access provider closing or external export,
- see audit events beyond their center/order scope,
- edit provider legal, contract or billing setup.

Recommended center dashboard structure:

- Center identity and provider relationship.
- Sites.
- Patients.
- Service requests and outcomes.
- Clear empty states for zero-start: configured center, configured first site, configured first patient, no submitted requests yet, CTA to create first request.

## End-To-End Happy Path

1. Admin creates Serenity provider setup.
2. Admin links a client center to Serenity with `ProviderClient`.
3. Admin creates the center site.
4. Admin creates the center contact.
5. Admin creates the patient in the correct site.
6. Admin creates or confirms carers attached to Serenity.
7. Admin reviews available service workflows.
8. Coordinator creates a service request for the configured center, site and patient.
9. Serenity creates the first scheduled visit.
10. Coordinator reviews agenda and coverage.
11. Coordinator assigns an eligible carer.
12. Carer executes the visit.
13. Carer submits checklist, evidence and incidents if needed.
14. Reviewer approves or rejects the care record.
15. Approved visit becomes eligible for closing.
16. Closing period includes approved visits and excludes unresolved visits.
17. Export prepares the external handoff package.
18. Audit trail explains who changed what and when.

## Product Boundaries

Serenity is not an EMR in the MVP. It captures operational care records, evidence and incidents needed to prove service delivery.

Serenity is not a payroll system in the MVP. It prepares approved operational data for settlement and external export.

Serenity is not a generic CRM. Client centers matter because they generate care demand and define where service is delivered.

Serenity is not just a scheduler. A scheduled visit has value only when it can be assigned, executed, evidenced, reviewed and closed.

## MVP Role Policy

For the current MVP:

- Admin setup is mandatory before provider operations.
- Coordinator operations must use configured client data.
- Reviewer approval is required before closing.
- Center Manager scope is limited to their center.
- Carer scope is limited to their profile and assigned visits.
- `EMPLOYEE` and `INDEPENDENT` are the only modeled carer relationship types.
- `permanent` and `casual` are deferred. They should become roster/contract policy attributes later, not primary carer relationship types in the MVP.

## SER-32 Carer Relationship Decision

Serenity models carers as part of the provider network. A center can request service and see the assigned carer in the context of its own visits, but the center does not own the carer relationship.

MVP decision:

- Keep `CarerKind.INDEPENDENT` and `CarerKind.EMPLOYEE`.
- Do not add `permanent` or `casual` now.
- Treat permanent/casual as future employment or roster policy fields if payroll, awards, leave, or shift entitlements require them.
- Keep `Carer.providerId` as the operational ownership link to the provider.
- Keep `Carer.ownerUserId` as the optional self-service identity link for the carer workspace.

Data required by relationship type:

| Relationship | Required MVP data | Deferred data |
| --- | --- | --- |
| `INDEPENDENT` | Provider link, owner user, name, contact, tax/business identifier when known, availability, credentials, skills derived from credentials, active status | Contract terms, insurance policy, payout method, rate card, document expiry automations |
| `EMPLOYEE` | Provider link, owner user, name, contact, employee classification label, availability, credentials, active status | Payroll id, permanent/casual status, award/contract rules, leave balances, HR onboarding |

Coordinator visibility:

- Can see the provider's active carers.
- Can see contact information needed for coordination.
- Can see availability, assigned visits, readiness, credential status, required skill match and restriction reasons.
- Should not edit the whole personal/admin profile during daily coverage.
- Should not see carers from another provider.

Admin ownership versus carer self-maintenance:

- Admin owns creation, provider link, relationship type, active status, and governance of credentials.
- Admin can correct setup gaps and credential status.
- Carer can maintain availability, practical contact details where enabled, credential evidence, and visit execution records.
- Reviewer reads care records and credential context but does not own carer setup.
- Center Manager only sees carer identity and care record context for visits in its own center.

## UX Implications

- Admin screens should feel like setup and governance.
- Coordinator screens should feel like daily control room and next action.
- Reviewer screens should feel like decision queues.
- Center screens should feel like request and visibility.
- Carer screens should feel mobile-first, task-first and self-contained.
- Audit should be available on demand, not permanently visible in primary workflows.
