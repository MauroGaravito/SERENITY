"use client";

import { type FormEvent, useState } from "react";
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

const recurrenceOptions = [
  { label: "One-off visit", value: "One-off visit" },
  { label: "Weekdays", value: "Mon-Fri" },
  { label: "Weekly", value: "Weekly" },
  { label: "Fortnightly", value: "Fortnightly" },
  { label: "Daily", value: "Daily" }
];

function getRecurrenceValue(value: string) {
  return recurrenceOptions.some((option) => option.value === value)
    ? value
    : recurrenceOptions[0].value;
}

export function ProviderOrderEditForm({ order }: { order: ServiceOrderRecord }) {
  const [scheduledStart, setScheduledStart] = useState(toDateTimeLocalValue(order.startsOn));
  const [scheduledEnd, setScheduledEnd] = useState(toDateTimeLocalValue(order.endsOn));
  const [plannedDurationMin, setPlannedDurationMin] = useState(String(order.plannedDurationMin));
  const [selectedSkillValues, setSelectedSkillValues] = useState(order.requiredSkills);
  const [recurrenceRule, setRecurrenceRule] = useState(getRecurrenceValue(order.frequency));
  const [formError, setFormError] = useState("");
  const windowMinutes = Math.round(
    (new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000
  );
  const invalidWindow = Number.isFinite(windowMinutes) && windowMinutes <= 0;
  const durationWarning =
    Number(plannedDurationMin) > 0 && Number.isFinite(windowMinutes) && windowMinutes > 0
      ? Number(plannedDurationMin) > windowMinutes
      : false;
  const plannedDurationHours = String(Number(plannedDurationMin) / 60);

  function toggleRequiredSkill(skill: string, isChecked: boolean) {
    setSelectedSkillValues((current) =>
      isChecked ? [...current, skill] : current.filter((item) => item !== skill)
    );
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    if (selectedSkillValues.length === 0) {
      event.preventDefault();
      setFormError("Select at least one required skill before saving the order.");
      return;
    }

    if (invalidWindow) {
      event.preventDefault();
      setFormError("Scheduled end must be later than scheduled start.");
      return;
    }

    if (durationWarning) {
      event.preventDefault();
      setFormError("Planned duration must fit inside the scheduled visit window.");
      return;
    }

    setFormError("");
  }

  return (
    <form action={updateServiceOrder} className="ops-panel order-form-panel" onSubmit={validateBeforeSubmit}>
      <div className="panel-heading">
        <div>
          <p className="card-tag">Edit request</p>
          <h2>Service request</h2>
          <p className="panel-copy">
            Update what care is needed, when it is needed, and which skills are required
            before coverage continues.
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
          <h3>Requested care window</h3>
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
              name="scheduledEnd"
              onChange={(event) => setScheduledEnd(event.target.value)}
              required
              type="datetime-local"
              value={scheduledEnd}
            />
          </label>

          <label>
            <span>Planned duration</span>
            <select
              onChange={(event) => setPlannedDurationMin(String(Math.round(Number(event.target.value) * 60)))}
              required
              value={plannedDurationHours}
            >
              <option value="1">1 hour</option>
              <option value="1.5">1.5 hours</option>
              <option value="2">2 hours</option>
              <option value="2.5">2.5 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
            <input name="plannedDurationMin" type="hidden" value={plannedDurationMin} />
          </label>

          <label>
            <span>Requested pattern</span>
            <select
              name="recurrenceRule"
              onChange={(event) => setRecurrenceRule(event.target.value)}
              required
              value={recurrenceRule}
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {invalidWindow ? (
          <p className="form-warning">Scheduled end must be later than scheduled start.</p>
        ) : null}
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
          <p className="field-help">Changing skills updates future coverage matches for this order.</p>
          <div className="pill-row checkbox-pill-row">
            {SKILL_CATALOG.map((skill) => (
              <label className="checkbox-pill" key={skill}>
                <input
                  defaultChecked={order.requiredSkills.includes(skill)}
                  name="requiredSkills"
                  onChange={(event) => toggleRequiredSkill(skill, event.target.checked)}
                  type="checkbox"
                  value={skill}
                />
                <span>{skill}</span>
              </label>
            ))}
          </div>
          {selectedSkillValues.length === 0 ? (
            <p className="form-warning">Select at least one required skill.</p>
          ) : null}
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
          Return to visit schedule and coverage to confirm every visit still has workable coverage.
        </p>
      </div>

      <div className="form-actions">
        {formError ? <p className="form-warning">{formError}</p> : null}
        <SaveButton />
      </div>
    </form>
  );
}
