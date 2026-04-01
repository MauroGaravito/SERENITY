"use client";

import { useEffect, useMemo, useState } from "react";
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

export function ProviderOrderForm({
  formData
}: {
  formData: ProviderOrderFormData;
}) {
  const [selectedCenterId, setSelectedCenterId] = useState(formData.centers[0]?.id ?? "");
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

  useEffect(() => {
    if (!facilities.some((facility) => facility.id === selectedFacilityId)) {
      setSelectedFacilityId(facilities[0]?.id ?? "");
    }
  }, [facilities, selectedFacilityId]);
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
    setPlannedDurationMin(String(selectedServiceType?.defaultDurationMin ?? 120));
  }, [selectedServiceType]);

  return (
    <form action={createServiceOrder} className="ops-panel order-form-panel">
      <div className="panel-heading">
        <div>
          <p className="card-tag">New demand</p>
          <h2>Create service order</h2>
        </div>
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
          <select key={selectedFacilityId} name="recipientId" defaultValue={recipients[0]?.id ?? ""}>
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
        <span>Instructions</span>
        <textarea
          name="instructions"
          placeholder="Operational instructions for the field visit"
          rows={4}
        />
      </label>

      <label className="form-block">
        <span>Coordinator notes</span>
        <textarea
          name="coordinatorNotes"
          placeholder="Internal notes for assignment and follow-up"
          rows={3}
        />
      </label>

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
