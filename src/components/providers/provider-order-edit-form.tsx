"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateServiceOrder } from "@/app/providers/actions";
import { SKILL_CATALOG } from "@/lib/catalogs";
import { ServiceOrderRecord } from "@/lib/providers";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending} type="submit">
      {pending ? "Saving order..." : "Save order"}
    </button>
  );
}

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function ProviderOrderEditForm({ order }: { order: ServiceOrderRecord }) {
  const [scheduledStart, setScheduledStart] = useState(toDateTimeLocalValue(order.startsOn));
  const [scheduledEnd, setScheduledEnd] = useState(toDateTimeLocalValue(order.endsOn));
  const [plannedDurationMin, setPlannedDurationMin] = useState(String(order.plannedDurationMin));
  const windowMinutes = Math.round(
    (new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000
  );
  const durationWarning =
    Number(plannedDurationMin) > 0 && Number.isFinite(windowMinutes) && windowMinutes > 0
      ? Number(plannedDurationMin) > windowMinutes
      : false;

  return (
    <form action={updateServiceOrder} className="ops-panel order-form-panel">
      <div className="panel-heading">
        <div>
          <p className="card-tag">Edit order</p>
          <h2>Demand settings</h2>
          <p className="panel-copy">
            Update demand, scheduling and eligibility inputs before coordinators continue
            coverage work.
          </p>
        </div>
      </div>

      <input name="orderId" type="hidden" value={order.id} />

      <section className="form-section">
        <div className="form-section-heading">
          <p className="card-tag">Demand details</p>
          <h3>Coordinator-facing summary</h3>
        </div>
        <div className="form-grid">
          <label className="form-grid-span-2">
            <span>Order title</span>
            <input defaultValue={order.title} name="title" required type="text" />
          </label>

          <label>
            <span>Priority</span>
            <select defaultValue={order.priority} name="priority" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <p className="card-tag">Scheduling</p>
          <h3>Service window</h3>
        </div>
        <div className="form-grid">
          <label>
            <span>Scheduled start</span>
            <input
              name="scheduledStart"
              onChange={(event) => setScheduledStart(event.target.value)}
              required
              type="datetime-local"
              value={scheduledStart}
            />
          </label>

          <label>
            <span>Scheduled end</span>
            <input
              min={scheduledStart}
              name="scheduledEnd"
              onChange={(event) => setScheduledEnd(event.target.value)}
              required
              type="datetime-local"
              value={scheduledEnd}
            />
          </label>

          <label>
            <span>Planned duration (min)</span>
            <input
              min="15"
              name="plannedDurationMin"
              onChange={(event) => setPlannedDurationMin(event.target.value)}
              required
              step="15"
              type="number"
              value={plannedDurationMin}
            />
          </label>

          <label>
            <span>Recurrence</span>
            <input defaultValue={order.frequency} name="recurrenceRule" required type="text" />
          </label>
        </div>
        {durationWarning ? (
          <p className="form-warning">Planned duration is longer than the scheduled window.</p>
        ) : null}
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <p className="card-tag">Requirements</p>
          <h3>Matching inputs</h3>
        </div>
        <label className="form-block">
          <span>Required language</span>
          <input defaultValue={order.requiredLanguage ?? ""} name="requiredLanguage" type="text" />
        </label>
        <fieldset className="form-block">
          <legend>Required skills</legend>
          <p className="field-help">Changing skills immediately affects the coverage pool below.</p>
          <div className="pill-row checkbox-pill-row">
            {SKILL_CATALOG.map((skill) => (
              <label className="checkbox-pill" key={skill}>
                <input
                  defaultChecked={order.requiredSkills.includes(skill)}
                  name="requiredSkills"
                  type="checkbox"
                  value={skill}
                />
                <span>{skill}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <p className="card-tag">Field instructions</p>
          <h3>Visit context</h3>
        </div>
        <label className="form-block">
          <span>Care instructions</span>
          <textarea defaultValue={order.instructions} name="instructions" rows={4} />
        </label>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <p className="card-tag">Internal notes</p>
          <h3>Provider coordination only</h3>
        </div>
        <label className="form-block">
          <span>Coordinator notes</span>
          <textarea defaultValue={order.notesForCoordinator} name="coordinatorNotes" rows={3} />
        </label>
      </section>

      <div className="note-block compact-note-block">
        <strong>After saving</strong>
        <p>
          Review the visit control panel and coverage pool to confirm the order still has workable
          assignment options.
        </p>
      </div>

      <div className="form-actions">
        <SaveButton />
      </div>
    </form>
  );
}
