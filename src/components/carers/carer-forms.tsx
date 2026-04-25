"use client";

import { useFormStatus } from "react-dom";
import {
  addCarerAvailabilityBlock,
  addVisitEvidence,
  reportVisitIncident,
  saveVisitChecklistItem,
  saveCarerCredential,
  updateCarerAvailabilityProfile,
  updateCarerVisitStatus
} from "@/app/carers/actions";
import { CarerWorkspaceRecord } from "@/lib/carers";

function PendingButton({
  disabled,
  idleLabel,
  pendingLabel
}: {
  disabled?: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function CarerStatusActionForm({
  action,
  disabled,
  visitId
}: {
  action: "start" | "complete" | "submit_review";
  disabled?: boolean;
  visitId: string;
}) {
  const labels = {
    start: { idle: "Start visit", pending: "Starting..." },
    complete: { idle: "Complete visit", pending: "Completing..." },
    submit_review: { idle: "Submit for review", pending: "Submitting..." }
  } as const;

  return (
    <form action={updateCarerVisitStatus}>
      <input name="visitId" type="hidden" value={visitId} />
      <input name="statusAction" type="hidden" value={action} />
      <PendingButton
        disabled={disabled}
        idleLabel={labels[action].idle}
        pendingLabel={labels[action].pending}
      />
    </form>
  );
}

export function CarerChecklistItemForm({
  item,
  visitId
}: {
  item: {
    label: string;
    note?: string;
    result: "pending" | "pass" | "fail" | "not_applicable";
    templateItemId: string;
  };
  visitId: string;
}) {
  return (
    <form action={saveVisitChecklistItem} className="checklist-item-card">
      <input name="visitId" type="hidden" value={visitId} />
      <input name="templateItemId" type="hidden" value={item.templateItemId} />
      <div className="checklist-item-copy">
        <strong>{item.label}</strong>
      </div>
      <div className="checklist-item-fields">
        <select defaultValue={item.result} name="result">
          <option value="pending">Pending</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="not_applicable">Not applicable</option>
        </select>
        <input
          defaultValue={item.note ?? ""}
          name="note"
          placeholder="Optional note"
          type="text"
        />
        <PendingButton idleLabel="Save item" pendingLabel="Saving..." />
      </div>
    </form>
  );
}

export function CarerEvidenceForm({ visitId }: { visitId: string }) {
  return (
    <form action={addVisitEvidence} className="compact-stack">
      <input name="visitId" type="hidden" value={visitId} />
      <div className="form-grid">
        <label>
          <span>Evidence type</span>
          <select defaultValue="photo" name="kind">
            <option value="photo">Photo</option>
            <option value="document">Document</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label>
          <span>Reference</span>
          <input
            name="reference"
            placeholder="URL or filename reference"
            required
            type="text"
          />
        </label>
      </div>
      <PendingButton idleLabel="Add evidence" pendingLabel="Adding..." />
    </form>
  );
}

export function CarerIncidentForm({ visitId }: { visitId: string }) {
  return (
    <form action={reportVisitIncident} className="compact-stack">
      <input name="visitId" type="hidden" value={visitId} />
      <div className="form-grid">
        <label>
          <span>Category</span>
          <input name="category" placeholder="Delay" required type="text" />
        </label>
        <label>
          <span>Severity</span>
          <select defaultValue="medium" name="severity">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      </div>
      <label className="form-block">
        <span>Summary</span>
        <textarea
          name="summary"
          placeholder="Describe what happened"
          required
          rows={3}
        />
      </label>
      <PendingButton idleLabel="Report incident" pendingLabel="Reporting..." />
    </form>
  );
}

export function CarerAvailabilityNoteForm({
  availability
}: {
  availability: string;
}) {
  return (
    <form action={updateCarerAvailabilityProfile} className="compact-stack">
      <label className="form-block">
        <span>Availability note</span>
        <textarea
          defaultValue={availability}
          name="availabilityNote"
          placeholder="Available Mon-Fri mornings"
          required
          rows={3}
        />
      </label>
      <PendingButton idleLabel="Save availability" pendingLabel="Saving..." />
    </form>
  );
}

export function CarerAvailabilityBlockForm() {
  return (
    <form action={addCarerAvailabilityBlock} className="compact-stack">
      <div className="form-grid">
        <label>
          <span>Block type</span>
          <select defaultValue="working" name="isWorking">
            <option value="working">Working</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label>
          <span>Start</span>
          <input name="startsAt" required type="datetime-local" />
        </label>
        <label>
          <span>End</span>
          <input name="endsAt" required type="datetime-local" />
        </label>
      </div>
      <PendingButton idleLabel="Add block" pendingLabel="Adding..." />
    </form>
  );
}

export function CarerCredentialForm({
  credential
}: {
  credential?: CarerWorkspaceRecord["credentials"][number];
}) {
  return (
    <form action={saveCarerCredential} className="compact-stack credential-form-card">
      {credential ? <input name="credentialId" type="hidden" value={credential.id} /> : null}
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            defaultValue={credential?.name ?? ""}
            name="name"
            placeholder="NDIS Worker Screening"
            required
            type="text"
          />
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={credential?.status ?? "pending"} name="status">
            <option value="pending">Pending</option>
            <option value="valid">Valid</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          <span>Issued at</span>
          <input
            defaultValue={credential?.issuedAt?.slice(0, 10) ?? ""}
            name="issuedAt"
            type="date"
          />
        </label>
        <label>
          <span>Expires at</span>
          <input
            defaultValue={credential?.expiresAt?.slice(0, 10) ?? ""}
            name="expiresAt"
            type="date"
          />
        </label>
        <label className="form-grid-span-2">
          <span>Document reference</span>
          <input
            defaultValue={credential?.documentUrl ?? ""}
            name="documentUrl"
            placeholder="manual://credentials/worker-screening.pdf"
            type="text"
          />
        </label>
      </div>
      <PendingButton
        idleLabel={credential ? "Update credential" : "Add credential"}
        pendingLabel={credential ? "Updating..." : "Adding..."}
      />
    </form>
  );
}
