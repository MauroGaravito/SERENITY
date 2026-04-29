"use client";

import { useFormStatus } from "react-dom";
import { createVisitForOrder } from "@/app/providers/actions";

function AddVisitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="ghost-link" disabled={pending} type="submit">
      {pending ? "Adding visit..." : "Add visit"}
    </button>
  );
}

export function ProviderVisitCreateForm({ orderId }: { orderId: string }) {
  return (
    <form action={createVisitForOrder} className="ops-panel order-form-panel compact-form">
      <div className="panel-heading">
        <div>
          <p className="card-tag">Schedule</p>
          <h2>Add visit</h2>
          <p className="panel-copy">
            Use this only when the order needs an extra dated visit outside the current schedule.
          </p>
        </div>
      </div>

      <input name="orderId" type="hidden" value={orderId} />

      <div className="form-grid">
        <label>
          <span>Scheduled start</span>
          <input defaultValue="2026-04-07T07:00" name="scheduledStart" required type="datetime-local" />
        </label>

        <label>
          <span>Scheduled end</span>
          <input defaultValue="2026-04-07T09:00" name="scheduledEnd" required type="datetime-local" />
        </label>
      </div>

      <label className="form-block">
        <span>Operational note</span>
        <textarea
          defaultValue="Additional visit awaiting assignment."
          name="exceptionReason"
          rows={3}
        />
      </label>

      <div className="form-actions">
        <AddVisitButton />
      </div>
    </form>
  );
}
