"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCenterServiceOrder } from "@/app/centers/actions";
import { CenterOrderFormData } from "@/lib/centers-data";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link" disabled={pending} type="submit">
      {pending ? "Submitting demand..." : "Submit demand"}
    </button>
  );
}

export function CenterOrderForm({ formData }: { formData: CenterOrderFormData }) {
  const [selectedFacilityId, setSelectedFacilityId] = useState(formData.facilities[0]?.id ?? "");
  const preferredServiceType =
    formData.serviceTypes.find((serviceType) => serviceType.code === "PERSONAL_CARE") ??
    formData.serviceTypes[0];
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(
    preferredServiceType?.id ?? ""
  );
  const recipients = useMemo(
    () => formData.facilities.find((facility) => facility.id === selectedFacilityId)?.recipients ?? [],
    [formData.facilities, selectedFacilityId]
  );
  const selectedServiceType = useMemo(
    () =>
      formData.serviceTypes.find((serviceType) => serviceType.id === selectedServiceTypeId) ??
      preferredServiceType,
    [formData.serviceTypes, preferredServiceType, selectedServiceTypeId]
  );
  const [plannedDurationMin, setPlannedDurationMin] = useState(
    String(preferredServiceType?.defaultDurationMin ?? 120)
  );

  useEffect(() => {
    if (!formData.facilities.some((facility) => facility.id === selectedFacilityId)) {
      setSelectedFacilityId(formData.facilities[0]?.id ?? "");
    }
  }, [formData.facilities, selectedFacilityId]);

  useEffect(() => {
    setPlannedDurationMin(String(selectedServiceType?.defaultDurationMin ?? 120));
  }, [selectedServiceType]);

  return (
    <form action={createCenterServiceOrder} className="ops-panel order-form-panel">
      <div className="panel-heading">
        <div>
          <p className="card-tag">New demand</p>
          <h2>Create service request</h2>
        </div>
      </div>

      <div className="form-grid">
        <label>
          <span>Provider</span>
          <select defaultValue={formData.providers[0]?.id ?? ""} name="providerId">
            {formData.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Facility</span>
          <select
            name="facilityId"
            onChange={(event) => setSelectedFacilityId(event.target.value)}
            value={selectedFacilityId}
          >
            {formData.facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Recipient</span>
          <select key={selectedFacilityId} defaultValue={recipients[0]?.id ?? ""} name="recipientId">
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
            onChange={(event) => setSelectedServiceTypeId(event.target.value)}
            value={selectedServiceTypeId}
          >
            {formData.serviceTypes.map((serviceType) => (
              <option key={serviceType.id} value={serviceType.id}>
                {serviceType.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Title</span>
          <input name="title" placeholder="Morning personal care support" required type="text" />
        </label>

        <label>
          <span>Priority</span>
          <select defaultValue="medium" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          <span>Scheduled start</span>
          <input defaultValue="2026-04-06T07:00" name="scheduledStart" required type="datetime-local" />
        </label>

        <label>
          <span>Scheduled end</span>
          <input defaultValue="2026-04-06T09:00" name="scheduledEnd" required type="datetime-local" />
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
          <input defaultValue="Mon-Fri, 07:00-09:00" name="recurrenceRule" required type="text" />
        </label>

        <label>
          <span>Required language</span>
          <input name="requiredLanguage" placeholder="English" type="text" />
        </label>

        <label>
          <span>Required skills</span>
          <input
            defaultValue="Manual handling, Personal care"
            name="requiredSkills"
            placeholder="Comma separated skills"
            required
            type="text"
          />
        </label>
      </div>

      <label className="form-block">
        <span>Care instructions</span>
        <textarea
          name="instructions"
          placeholder="Service expectations, care routine and outcome required"
          rows={4}
        />
      </label>

      <label className="form-block">
        <span>Provider handoff note</span>
        <textarea
          name="handoffNote"
          placeholder="Coverage constraints, timing sensitivity or escalation notes"
          rows={3}
        />
      </label>

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
