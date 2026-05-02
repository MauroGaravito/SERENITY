# Work item: Manual QA for Serenity v2.1.0 zero-start

## Title

Manual QA for Serenity v2.1.0 zero-start release

## Description

Validate Serenity `v2.1.0` from a clean Colombia seed. The goal is to confirm that the product now starts from real configured data, not old pre-seeded activity, and that review, closing, export, and audit only become meaningful after a real operational flow has happened.

Primary tester: Mauro.

Second tester: use the user manual only. The second tester should not need engineering context beyond `docs/user-manual.md`, the local URL, and the demo credentials.

Reference docs:

- `docs/user-manual.md`
- `docs/current-demo-state-and-qa.md`
- `docs/visual-qa-ser-35-2026-05-02.md`

Setup:

```powershell
docker compose up -d postgres
npm run db:seed:colombia
npm run dev
```

Expected local URL:

```text
http://127.0.0.1:3000
```

Shared demo password:

```text
SerenityDemo!2026
```

## Acceptance criteria

- Colombia seed starts with 0 service orders, 0 visits, 0 closing periods, 0 export jobs, and no operational audit activity.
- Admin can see provider, center, site, patient, carers, service workflows, and setup readiness.
- Laura can create the first real service request for Rosalba from the center portal.
- Mauricio can receive that request, assign Gabriel, and coordinate the visit.
- Gabriel can execute the visit, complete checklist, attach evidence, report an incident if needed, and submit for review.
- Diana can approve or reject the submitted care record.
- An approved visit creates or appears in an open closing period.
- Closing explains missing settlement while the period is open.
- Export does not show a package until the closing period is locked.
- Audit starts empty and becomes meaningful after review/closing/export actions.
- Desktop and mobile views do not show horizontal overflow or broken action hierarchy.
- The second tester can complete their assigned tests using only `docs/user-manual.md`.

## Sub-items

### QA-01 - Environment and zero-start seed

Owner: Mauro

Steps:

1. Start Postgres.
2. Run `npm run db:seed:colombia`.
3. Run `npm run dev`.
4. Log in as `mauricio@serenity.local`.
5. Open `/providers/orders`, `/providers/closing`, `/providers/export`, and `/providers/audit`.

Expected:

- Orders shows no provider demand yet.
- Closing shows no closing periods yet.
- Export shows no export packages yet.
- Audit shows no period-level activity yet.
- No page depends on old seeded orders.

### QA-02 - Admin setup readiness

Owner: second tester

Reference: `docs/user-manual.md`

Login:

```text
admin@serenity.local
```

Steps:

1. Open `/admin`.
2. Open `/admin/clients`.
3. Open `/admin/care-team`.
4. Open `/admin/workflows`.

Expected:

- Serenity Homecare Antioquia is visible.
- Centro de Cuidado Niquia, Sede Niquia, Laura, and Rosalba are visible.
- Three carers are visible: Alvaro, Gabriel, Gloria.
- Service workflows are configured.
- The tester can understand what must exist before a service request starts.

### QA-03 - Center creates first request

Owner: Mauro

Login:

```text
laura@serenity.local
```

Steps:

1. Open `/centers`.
2. Confirm the portal shows center, site, patient, provider relation, and empty orders.
3. Open `/centers/orders`.
4. Create a request for Rosalba at Sede Niquia using the default Personal Care scenario.
5. Submit the request.

Expected:

- Laura starts from center context, not provider operations.
- Created order redirects to the center order detail.
- Audit records the request and initial visit.
- The order appears in Laura's center orders list.

### QA-04 - Provider receives and coordinates request

Owner: Mauro

Login:

```text
mauricio@serenity.local
```

Steps:

1. Open `/providers/orders`.
2. Open the new `SR-2401`.
3. Confirm Rosalba, Sede Niquia, Centro de Cuidado Niquia, required skills, and service window.
4. Assign Gabriel if he is eligible.
5. Confirm the visit moves into a covered/confirmed operating state.

Expected:

- Mauricio sees the request created by Laura.
- Matching explains eligible carers.
- Gabriel can be assigned for the first Niquia/Rosalba flow.
- Provider order audit captures assignment/status changes.

### QA-05 - Carer executes visit

Owner: second tester

Reference: `docs/user-manual.md`

Login:

```text
gabriel@serenity.local
```

Steps:

1. Open `/carers`.
2. Open the assigned visit.
3. Start the visit.
4. Complete checklist items.
5. Add at least one evidence item.
6. Optionally report one low-severity incident.
7. Complete the visit.
8. Submit for review.

Expected:

- Gabriel only sees his carer workspace.
- Submit for review is blocked until checklist and evidence requirements are met.
- After submission, the visit reaches `under_review`.
- The second tester can follow this using only the manual.

### QA-06 - Reviewer approves care record

Owner: Mauro

Login:

```text
diana@serenity.local
```

Steps:

1. Open `/providers/orders`.
2. Open `SR-2401`.
3. Open the care record.
4. Confirm checklist, evidence, notes, and incident context are visible.
5. Approve the visit.

Expected:

- Approval is available only when review context is complete.
- Visit becomes `approved`.
- A closing period `open` is created or reused for the visit date.
- Audit includes the review event and links it to closing via `closingPeriodId`.

### QA-07 - Closing after approval

Owner: Mauro

Login:

```text
mauricio@serenity.local
```

Steps:

1. Open `/providers/closing`.
2. Select the open period created by the approved visit.
3. Confirm approved visit appears.
4. Save settlement values for approved minutes, billable amount, and payable amount.
5. Add one expense if appropriate.
6. Lock the period.

Expected:

- Closing was empty before approval.
- Approved visit appears only after review approval.
- Period cannot be locked until settlement exists for approved visits.
- Expense and settlement actions appear in audit.
- Locked period is ready for export.

### QA-08 - Export after lock

Owner: Mauro

Login:

```text
mauricio@serenity.local
```

Steps:

1. Open `/providers/export`.
2. Confirm the locked period appears.
3. Download JSON.
4. Download CSV.
5. Queue one `manual_handoff` sync job.
6. Process the job.
7. Mark or confirm acknowledgement if the job reaches a sent/acknowledgeable state.

Expected:

- Export did not show a package while the period was open.
- Export package appears after lock.
- JSON and CSV downloads work.
- Sync job lifecycle is visible.
- Export audit records delivery actions.

### QA-09 - Audit trail

Owner: second tester

Reference: `docs/user-manual.md`

Login:

```text
mauricio@serenity.local
```

Steps:

1. Open `/providers/audit`.
2. Select the period from the Niquia/Rosalba flow.
3. Read the timeline.
4. Compare it with order audit in `SR-2401`.

Expected:

- Audit is empty in zero-start before actions.
- After the workflow, period audit shows review, settlement, lock/export, or sync actions.
- The order audit shows the operational story for `SR-2401`.
- The tester can explain who did what and when.

### QA-10 - Visual smoke test

Owner: second tester

Reference: `docs/user-manual.md`

Steps:

1. Review admin, provider, center, and carer surfaces on desktop.
2. Review `/centers`, `/centers/orders`, `/providers/orders`, `/providers/closing`, `/providers/export`, `/providers/audit`, `/carers`, `/carers/availability`, `/carers/credentials` on a narrow/mobile viewport.

Expected:

- No horizontal overflow.
- Empty states are understandable.
- Primary actions are visually clear.
- Destructive or secondary actions are not confused with primary actions.
- Forms may be long, but hierarchy remains understandable.

## Suggested Plane closing note after QA

```text
Manual QA completed for Serenity v2.1.0 zero-start.

Validated Colombia seed, admin setup, center request creation, provider coordination, carer execution, reviewer approval, closing, export, audit, and visual smoke across role surfaces.

Second tester used docs/user-manual.md as the only functional guide.

Known non-blocking item:
- Existing Next build warning for <img> in carer evidence rendering.
```
