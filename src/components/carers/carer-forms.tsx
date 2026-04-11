"use client";

import { useFormStatus } from "react-dom";
import {
  addVisitEvidence,
  reportVisitIncident,
  saveVisitChecklistItem,
  updateCarerVisitStatus
} from "@/app/carers/actions";

function PendingButton({
  idleLabel,
  pendingLabel
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function CarerStatusActionForm({
  action,
  visitId
}: {
  action: "start" | "complete" | "submit_review";
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
