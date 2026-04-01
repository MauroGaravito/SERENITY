"use client";

import { useFormStatus } from "react-dom";
import { updateServiceOrder } from "@/app/providers/actions";
import { ServiceOrderRecord } from "@/lib/providers";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending} type="submit">
      {pending ? "Saving order..." : "Save order"}
    </button>
  );
}

export function ProviderOrderEditForm({ order }: { order: ServiceOrderRecord }) {
  return (
    <form action={updateServiceOrder} className="ops-panel order-form-panel">
      <div className="panel-heading">
        <div>
          <p className="card-tag">Edit order</p>
          <h2>Operational settings</h2>
        </div>
      </div>

      <input name="orderId" type="hidden" value={order.id} />

      <div className="form-grid">
        <label>
          <span>Title</span>
          <input defaultValue={order.title} name="title" required type="text" />
        </label>

        <label>
          <span>Priority</span>
          <select defaultValue={order.priority} name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          <span>Planned duration (min)</span>
          <input
            defaultValue={String(order.plannedDurationMin)}
            min="15"
            name="plannedDurationMin"
            required
            step="15"
            type="number"
          />
        </label>

        <label>
          <span>Required language</span>
          <input defaultValue={order.requiredLanguage ?? ""} name="requiredLanguage" type="text" />
        </label>

        <label className="form-grid-span-2">
          <span>Recurrence</span>
          <input defaultValue={order.frequency} name="recurrenceRule" required type="text" />
        </label>

        <label className="form-grid-span-2">
          <span>Required skills</span>
          <input defaultValue={order.requiredSkills.join(", ")} name="requiredSkills" required type="text" />
        </label>
      </div>

      <label className="form-block">
        <span>Instructions</span>
        <textarea defaultValue={order.instructions} name="instructions" rows={4} />
      </label>

      <label className="form-block">
        <span>Coordinator notes</span>
        <textarea defaultValue={order.notesForCoordinator} name="coordinatorNotes" rows={3} />
      </label>

      <div className="form-actions">
        <SaveButton />
      </div>
    </form>
  );
}
