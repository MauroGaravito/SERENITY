"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createServiceOrder } from "@/app/providers/actions";
import { ProviderOrderFormData } from "@/lib/providers-data";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending} type="submit">
      {pending ? "Creating order..." : "Create order"}
    </button>
  );
}

function toDateTimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function addMinutes(dateTime: string, minutes: number) {
  const parsed = new Date(dateTime);

  if (Number.isNaN(parsed.getTime())) {
    return dateTime;
  }

  return toDateTimeLocalValue(new Date(parsed.getTime() + minutes * 60000));
}

const recurrenceOptions = [
  { label: "One-off visit", value: "One-off visit" },
  { label: "Weekdays", value: "Mon-Fri" },
  { label: "Weekly", value: "Weekly" },
  { label: "Fortnightly", value: "Fortnightly" },
  { label: "Daily", value: "Daily" }
];

const defaultSelectedSkills = ["Manual handling", "Personal hygiene support"];

export function ProviderOrderForm({
  formData
}: {
  formData: ProviderOrderFormData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState(formData.centers[0]?.id ?? "");
  const selectedCenter = useMemo(
    () => formData.centers.find((center) => center.id === selectedCenterId),
    [formData.centers, selectedCenterId]
  );
  const preferredServiceType =
    formData.serviceTypes.find((serviceType) => serviceType.code === "PERSONAL_CARE") ??
    formData.serviceTypes[0];
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(
    preferredServiceType?.id ?? ""
  );
  const facilities = useMemo(
    () => formData.centers.find((center) => center.id === selectedCenterId)?.facilities ?? [],
    [formData.centers, selectedCenterId]
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id ?? "");
  const recipients = useMemo(
    () => facilities.find((facility) => facility.id === selectedFacilityId)?.recipients ?? [],
    [facilities, selectedFacilityId]
  );
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipients[0]?.id ?? "");

  useEffect(() => {
    if (!facilities.some((facility) => facility.id === selectedFacilityId)) {
      setSelectedFacilityId(facilities[0]?.id ?? "");
    }
  }, [facilities, selectedFacilityId]);

  useEffect(() => {
    if (!recipients.some((recipient) => recipient.id === selectedRecipientId)) {
      setSelectedRecipientId(recipients[0]?.id ?? "");
    }
  }, [recipients, selectedRecipientId]);

  const selectedServiceType = useMemo(
    () =>
      formData.serviceTypes.find((serviceType) => serviceType.id === selectedServiceTypeId) ??
      preferredServiceType,
    [formData.serviceTypes, preferredServiceType, selectedServiceTypeId]
  );
  const [plannedDurationMin, setPlannedDurationMin] = useState(
    String(preferredServiceType?.defaultDurationMin ?? 120)
  );
  const [selectedSkillValues, setSelectedSkillValues] = useState(defaultSelectedSkills);
  const [recurrenceRule, setRecurrenceRule] = useState(recurrenceOptions[1].value);
  const [formError, setFormError] = useState("");
  const [scheduledStart, setScheduledStart] = useState("2026-04-06T07:00");
  const [scheduledEnd, setScheduledEnd] = useState("2026-04-06T09:00");

  const selectedFacility = facilities.find((facility) => facility.id === selectedFacilityId);
  const selectedRecipient = recipients.find((recipient) => recipient.id === selectedRecipientId);
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
      setFormError("Select at least one required skill before creating the order.");
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
    <>
      <section className="orders-action-bar">
        <div>
          <p className="card-tag">New demand</p>
          <h2>New service demand</h2>
          <p className="panel-copy">
            Capture a new request without leaving the active orders workspace.
          </p>
        </div>
        <button className="primary-link" onClick={() => setIsOpen(true)} type="button">
          New order
        </button>
      </section>

      {isOpen ? (
        <div
          aria-modal="true"
          className="modal-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
        >
          <div className="modal-panel order-modal-panel" onClick={(event) => event.stopPropagation()}>
            <form action={createServiceOrder} className="order-form-panel" onSubmit={validateBeforeSubmit}>
              <div className="panel-heading">
                <div>
                  <p className="card-tag">New demand</p>
                  <h2>Create service order</h2>
                  <p className="panel-copy">
                    Create the demand record and its first scheduled visit, then continue into
                    assignment and coverage.
                  </p>
                </div>
                <button className="ghost-link modal-close-button" onClick={() => setIsOpen(false)} type="button">
                  Close
                </button>
              </div>

              <div className="order-form-layout">
                <div className="order-form-sections">
                  <section className="form-section">
                    <div className="form-section-heading">
                      <p className="card-tag">Demand details</p>
                      <h3>Who needs service</h3>
                    </div>
                    <div className="form-grid">
                      <label>
                        <span>Center</span>
                        <select
                          name="centerId"
                          onChange={(event) => {
                            const nextCenterId = event.target.value;
                            setSelectedCenterId(nextCenterId);
                            const nextFacility =
                              formData.centers.find((center) => center.id === nextCenterId)?.facilities[0];
                            setSelectedFacilityId(nextFacility?.id ?? "");
                          }}
                          required
                          value={selectedCenterId}
                        >
                          {formData.centers.map((center) => (
                            <option key={center.id} value={center.id}>
                              {center.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Facility</span>
                        <select
                          name="facilityId"
                          onChange={(event) => setSelectedFacilityId(event.target.value)}
                          required
                          value={selectedFacilityId}
                        >
                          {facilities.map((facility) => (
                            <option key={facility.id} value={facility.id}>
                              {facility.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Recipient</span>
                        <select
                          name="recipientId"
                          onChange={(event) => setSelectedRecipientId(event.target.value)}
                          required
                          value={selectedRecipientId}
                        >
                          {recipients.map((recipient) => (
                            <option key={recipient.id} value={recipient.id}>
                              {recipient.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Service type</span>
                        <select
                          name="serviceTypeId"
                          onChange={(event) => {
                            const nextServiceTypeId = event.target.value;
                            const nextServiceType = formData.serviceTypes.find(
                              (serviceType) => serviceType.id === nextServiceTypeId
                            );
                            const nextDuration = nextServiceType?.defaultDurationMin ?? 120;
                            setSelectedServiceTypeId(nextServiceTypeId);
                            setPlannedDurationMin(String(nextDuration));
                            setScheduledEnd(addMinutes(scheduledStart, nextDuration));
                          }}
                          required
                          value={selectedServiceTypeId}
                        >
                          {formData.serviceTypes.map((serviceType) => (
                            <option key={serviceType.id} value={serviceType.id}>
                              {serviceType.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-grid-span-2">
                        <span>Order title</span>
                        <input name="title" placeholder="Morning personal care support" required type="text" />
                      </label>

                      <label>
                        <span>Priority</span>
                        <select defaultValue="medium" name="priority" required>
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
                      <h3>First visit window</h3>
                    </div>
                    <div className="form-grid">
                      <label>
                        <span>Scheduled start</span>
                        <input
                          name="scheduledStart"
                          onChange={(event) => {
                            const nextStart = event.target.value;
                            setScheduledStart(nextStart);
                            setScheduledEnd(addMinutes(nextStart, Number(plannedDurationMin) || 0));
                          }}
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
                          onChange={(event) => {
                            const nextMinutes = Math.round(Number(event.target.value) * 60);
                            setPlannedDurationMin(String(nextMinutes));
                            setScheduledEnd(addMinutes(scheduledStart, nextMinutes));
                          }}
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
                        <span>Recurrence</span>
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
                      <p className="form-warning">
                        Scheduled end must be later than scheduled start.
                      </p>
                    ) : null}
                    {durationWarning ? (
                      <p className="form-warning">
                        Planned duration is longer than the scheduled window.
                      </p>
                    ) : null}
                  </section>

                  <section className="form-section">
                    <div className="form-section-heading">
                      <p className="card-tag">Requirements</p>
                      <h3>Eligibility inputs</h3>
                    </div>
                    <label className="form-block">
                      <span>Required language</span>
                      <input name="requiredLanguage" placeholder="English" type="text" />
                    </label>
                    <fieldset className="form-block">
                      <legend>Required skills</legend>
                      <p className="field-help">At least one skill is required for matching and coverage.</p>
                      <div className="pill-row checkbox-pill-row">
                        {formData.skills.map((skill) => {
                          const defaultChecked = defaultSelectedSkills.includes(skill);

                          return (
                            <label className="checkbox-pill" key={skill}>
                              <input
                                defaultChecked={defaultChecked}
                                name="requiredSkills"
                                onChange={(event) => toggleRequiredSkill(skill, event.target.checked)}
                                type="checkbox"
                                value={skill}
                              />
                              <span>{skill}</span>
                            </label>
                          );
                        })}
                      </div>
                      {selectedSkillValues.length === 0 ? (
                        <p className="form-warning">Select at least one required skill.</p>
                      ) : null}
                    </fieldset>
                  </section>

                  <section className="form-section">
                    <div className="form-section-heading">
                      <p className="card-tag">Field instructions</p>
                      <h3>What the carer needs to know</h3>
                    </div>
                    <label className="form-block">
                      <span>Care instructions</span>
                      <textarea
                        name="instructions"
                        placeholder="Operational instructions visible in the visit context"
                        rows={4}
                      />
                    </label>
                  </section>

                  <section className="form-section">
                    <div className="form-section-heading">
                      <p className="card-tag">Internal notes</p>
                      <h3>Provider coordination only</h3>
                    </div>
                    <label className="form-block">
                      <span>Coordinator notes</span>
                      <textarea
                        name="coordinatorNotes"
                        placeholder="Assignment constraints, escalation context, or handoff notes"
                        rows={3}
                      />
                    </label>
                  </section>
                </div>

                <aside className="order-form-summary">
                  <p className="card-tag">Review</p>
                  <h3>Creation outcome</h3>
                  <dl>
                    <div>
                      <dt>Demand</dt>
                      <dd>{selectedRecipient?.name ?? "Select recipient"}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{selectedCenter?.name ?? "Select center"} / {selectedFacility?.name ?? "facility"}</dd>
                    </div>
                    <div>
                      <dt>Service</dt>
                      <dd>{selectedServiceType?.name ?? "Select service type"}</dd>
                    </div>
                    <div>
                      <dt>First visit</dt>
                      <dd>{scheduledStart} to {scheduledEnd}</dd>
                    </div>
                  </dl>
                  <div className="note-block compact-note-block">
                    <strong>After creation</strong>
                    <p>The order opens with one scheduled visit awaiting assignment in coverage management.</p>
                  </div>
                </aside>
              </div>

              <div className="form-actions">
                {formError ? <p className="form-warning">{formError}</p> : null}
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
