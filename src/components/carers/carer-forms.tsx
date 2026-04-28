"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CarerWorkspaceRecord } from "@/lib/carers";

export type FormAction = (formData: FormData) => void | Promise<void>;

const availabilityNoteOptions = [
  "Available Mon-Fri mornings",
  "Available Mon-Fri afternoons",
  "Available weekdays full day",
  "Available Mon-Fri split shift",
  "Available weekends",
  "Available evenings",
  "Limited availability this week",
  "Custom"
];

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
  formAction,
  disabled,
  visitId
}: {
  action: "start" | "complete" | "submit_review";
  formAction: FormAction;
  disabled?: boolean;
  visitId: string;
}) {
  const labels = {
    start: { idle: "Start visit", pending: "Starting..." },
    complete: { idle: "Complete visit", pending: "Completing..." },
    submit_review: { idle: "Submit for review", pending: "Submitting..." }
  } as const;

  return (
    <form action={formAction}>
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
  formAction,
  item,
  visitId
}: {
  formAction: FormAction;
  item: {
    label: string;
    note?: string;
    result: "pending" | "pass" | "fail" | "not_applicable";
    templateItemId: string;
  };
  visitId: string;
}) {
  return (
    <form action={formAction} className="checklist-item-card">
      <input name="visitId" type="hidden" value={visitId} />
      <input name="templateItemId" type="hidden" value={item.templateItemId} />
      <div className="checklist-item-copy">
        <strong>{item.label}</strong>
      </div>
      <div className="checklist-item-fields">
        <select defaultValue={item.result} name="result">
          <option value="pending">Pending</option>
          <option value="pass">Completed</option>
          <option value="fail">Needs attention</option>
          <option value="not_applicable">Not required</option>
        </select>
        <input
          defaultValue={item.note ?? ""}
          name="note"
          placeholder="Care note"
          type="text"
        />
        <PendingButton idleLabel="Save item" pendingLabel="Saving..." />
      </div>
    </form>
  );
}

export function CarerEvidenceForm({
  formAction,
  visitId
}: {
  formAction: FormAction;
  visitId: string;
}) {
  return (
    <form action={formAction} className="compact-stack">
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

export function CarerIncidentForm({
  formAction,
  visitId
}: {
  formAction: FormAction;
  visitId: string;
}) {
  return (
    <form action={formAction} className="compact-stack">
      <input name="visitId" type="hidden" value={visitId} />
      <div className="form-grid">
        <label>
          <span>What type of note or exception is this?</span>
          <select defaultValue="Delay" name="category">
            <option value="Delay">Delay</option>
            <option value="Client unavailable">Client unavailable</option>
            <option value="Client refused service">Client refused service</option>
            <option value="Client wellbeing concern">Client wellbeing concern</option>
            <option value="Medication concern">Medication concern</option>
            <option value="Meal or hydration concern">Meal or hydration concern</option>
            <option value="Personal care concern">Personal care concern</option>
            <option value="Manual handling concern">Manual handling concern</option>
            <option value="Injury or fall">Injury or fall</option>
            <option value="Behavioural incident">Behavioural incident</option>
            <option value="Family or visitor issue">Family or visitor issue</option>
            <option value="Access issue">Access issue</option>
            <option value="Equipment issue">Equipment issue</option>
            <option value="Environmental hazard">Environmental hazard</option>
            <option value="Missing information">Missing information</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>
          <span>Who needs to know?</span>
          <select defaultValue="medium" name="severity">
            <option value="low">Low - note only</option>
            <option value="medium">Medium - coordinator review</option>
            <option value="high">High - urgent provider follow-up</option>
            <option value="critical">Critical - immediate escalation</option>
          </select>
        </label>
      </div>
      <label className="form-block">
        <span>What happened and what action was taken?</span>
        <textarea
          name="summary"
          placeholder="Describe the situation, care provided, and any follow-up needed"
          required
          rows={3}
        />
      </label>
      <PendingButton idleLabel="Save note" pendingLabel="Saving..." />
    </form>
  );
}

export function CarerAvailabilityNoteForm({
  availability,
  formAction
}: {
  availability: string;
  formAction: FormAction;
}) {
  const initialPreset = availabilityNoteOptions.includes(availability) ? availability : "Custom";
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customAvailability, setCustomAvailability] = useState(availability);
  const availabilityNote = selectedPreset === "Custom" ? customAvailability : selectedPreset;

  useEffect(() => {
    const nextPreset = availabilityNoteOptions.includes(availability) ? availability : "Custom";
    setSelectedPreset(nextPreset);
    setCustomAvailability(availability);
  }, [availability]);

  return (
    <form action={formAction} className="compact-stack task-form-panel">
      <div className="task-form-heading">
        <span className="workspace-icon workspace-icon-availability" aria-hidden="true" />
        <div>
          <strong>Normal working pattern</strong>
          <p>Short summary shown to coordinators during matching</p>
        </div>
      </div>
      <label className="form-block task-field-card">
        <span>Choose a normal availability pattern</span>
        <select onChange={(event) => setSelectedPreset(event.target.value)} value={selectedPreset}>
          {availabilityNoteOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {selectedPreset !== "Custom" ? (
        <div className="availability-preset-preview">
          <strong>{selectedPreset}</strong>
          <p>This saved pattern is shown to coordinators during matching and visit planning.</p>
        </div>
      ) : null}
      {selectedPreset === "Custom" ? (
        <label className="form-block task-field-card">
          <span>Describe the custom pattern</span>
          <textarea
            onChange={(event) => setCustomAvailability(event.target.value)}
            placeholder="Available Mon-Fri mornings"
            required
            rows={3}
            value={customAvailability}
          />
        </label>
      ) : null}
      <input name="availabilityNote" type="hidden" value={availabilityNote} />
      <PendingButton idleLabel="Save availability" pendingLabel="Saving..." />
    </form>
  );
}

export function CarerAvailabilityBlockForm({
  availabilityBlocks,
  formAction
}: {
  availabilityBlocks: CarerWorkspaceRecord["availabilityBlocks"];
  formAction: FormAction;
}) {
  const calendar = useMemo(() => getMonthDaysStartingMonday(), []);
  const timeOptions = useMemo(() => getHalfHourOptions(), []);
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue());
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [blockType, setBlockType] = useState("working");
  const effectiveEndDate = rangeEndDate || selectedDate;
  const startsAt = `${selectedDate}T${startTime}`;
  const endsAt = `${effectiveEndDate}T${endTime}`;
  const overlappingBlock = findOverlappingAvailabilityBlock({
    availabilityBlocks,
    endsAt,
    startsAt
  });

  useEffect(() => {
    const nextDate = findFirstAvailableCalendarDate({
      availabilityBlocks,
      calendarDays: calendar.days,
      endTime,
      startTime
    });

    if (nextDate && findOverlappingAvailabilityBlock({ availabilityBlocks, endsAt, startsAt })) {
      setSelectedDate(nextDate);
      setRangeEndDate("");
    }
  }, [availabilityBlocks, calendar.days, endTime, endsAt, startTime, startsAt]);

  function selectRangeDate(value: string) {
    if (!selectedDate || rangeEndDate) {
      setSelectedDate(value);
      setRangeEndDate("");
      return;
    }

    if (value < selectedDate) {
      setRangeEndDate(selectedDate);
      setSelectedDate(value);
      return;
    }

    setRangeEndDate(value);
  }

  function isInSelectedRange(value: string) {
    const endDate = effectiveEndDate;
    return value >= selectedDate && value <= endDate;
  }

  const selectedStartDay = calendar.days.find((day) => day.value === selectedDate);
  const selectedEndDay = calendar.days.find((day) => day.value === effectiveEndDate);

  return (
    <form action={formAction} className="compact-stack task-form-panel">
      <div className="task-form-heading">
        <span className="workspace-icon workspace-icon-calendar" aria-hidden="true" />
        <div>
          <strong>Add a dated range</strong>
          <p>Saved ranges appear on the planner after submission</p>
        </div>
      </div>
      <div className="availability-range-builder">
        <div className="month-range-picker" aria-label="Select date range">
          <div className="month-range-head">
            <strong>{calendar.monthLabel}</strong>
            <span>Click the first day, then click the last day.</span>
          </div>
          <div className="month-weekdays" aria-hidden="true">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="month-days">
            {calendar.days.map((day) => (
              <button
                aria-pressed={isInSelectedRange(day.value)}
                className={`month-day-button ${isInSelectedRange(day.value) ? "is-in-range" : ""} ${
                  day.value === selectedDate ? "is-selected-start" : ""
                } ${day.value === effectiveEndDate ? "is-selected-end" : ""} ${
                  day.isCurrentMonth ? "" : "is-outside-month"
                } ${day.isToday ? "is-today" : ""}`}
                key={day.value}
                onClick={() => selectRangeDate(day.value)}
                type="button"
              >
                <span>{day.day}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="task-field-card">
          <span>Is this working or unavailable time?</span>
          <select name="isWorking" onChange={(event) => setBlockType(event.target.value)} value={blockType}>
            <option value="working">Working</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <div className="range-time-grid">
          <label className="task-field-card">
            <span>Start time</span>
            <select onChange={(event) => setStartTime(event.target.value)} value={startTime}>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="task-field-card">
            <span>End time</span>
            <select onChange={(event) => setEndTime(event.target.value)} value={endTime}>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={`range-preview range-preview-${blockType}`}>
          <strong>{blockType === "working" ? "Working range" : "Unavailable range"}</strong>
          <p>
            {selectedStartDay?.fullLabel}
            {effectiveEndDate !== selectedDate
              ? ` to ${selectedEndDay?.fullLabel}`
              : ""}
            : {startTime} - {endTime}
          </p>
        </div>
        {overlappingBlock ? (
          <div className="range-conflict" role="alert">
            <strong>Range conflict</strong>
            <p>
              This overlaps an existing {overlappingBlock.isWorking ? "working" : "unavailable"} range from{" "}
              {formatBlockTime(overlappingBlock.startsAt)} to {formatBlockTime(overlappingBlock.endsAt)}.
            </p>
          </div>
        ) : null}
        <input name="startsAt" type="hidden" value={startsAt} />
        <input name="endsAt" type="hidden" value={endsAt} />
      </div>
      <PendingButton disabled={Boolean(overlappingBlock)} idleLabel="Add block" pendingLabel="Adding..." />
    </form>
  );
}

export function DeleteCarerAvailabilityBlockForm({
  blockId,
  formAction
}: {
  blockId: string;
  formAction: FormAction;
}) {
  return (
    <form action={formAction}>
      <input name="availabilityBlockId" type="hidden" value={blockId} />
      <button className="inline-delete-button" type="submit">
        Remove
      </button>
    </form>
  );
}

function getMonthDaysStartingMonday() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  const startOffset = (calendarStart.getDay() + 6) % 7;
  calendarStart.setDate(calendarStart.getDate() - startOffset);
  const calendarEnd = new Date(monthEnd);
  const endOffset = 6 - ((calendarEnd.getDay() + 6) % 7);
  calendarEnd.setDate(calendarEnd.getDate() + endOffset);
  const totalDays = Math.round((calendarEnd.getTime() - calendarStart.getTime()) / 86400000) + 1;

  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    const value = toDateValue(date);
    const todayValue = toDateValue(today);

    return {
      value,
      weekday: new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("en-AU", { day: "2-digit" }).format(date),
      fullLabel: new Intl.DateTimeFormat("en-AU", {
        weekday: "long",
        day: "2-digit",
        month: "long"
      }).format(date),
      isCurrentMonth: date.getMonth() === today.getMonth(),
      isToday: value === todayValue
    };
  });

  return {
    monthLabel: new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric"
    }).format(monthStart),
    days
  };
}

function getTodayDateValue() {
  return toDateValue(new Date());
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getHalfHourOptions() {
  return Array.from({ length: 48 }, (_, index) => {
    const hours = Math.floor(index / 2);
    const minutes = index % 2 === 0 ? "00" : "30";
    const value = `${String(hours).padStart(2, "0")}:${minutes}`;

    return {
      value,
      label: value
    };
  });
}

function findOverlappingAvailabilityBlock({
  availabilityBlocks,
  endsAt,
  startsAt
}: {
  availabilityBlocks: CarerWorkspaceRecord["availabilityBlocks"];
  endsAt: string;
  startsAt: string;
}) {
  const proposedStart = new Date(startsAt).getTime();
  const proposedEnd = new Date(endsAt).getTime();

  if (Number.isNaN(proposedStart) || Number.isNaN(proposedEnd) || proposedEnd <= proposedStart) {
    return undefined;
  }

  return availabilityBlocks.find((block) => {
    const existingStart = new Date(block.startsAt).getTime();
    const existingEnd = new Date(block.endsAt).getTime();

    return existingStart < proposedEnd && existingEnd > proposedStart;
  });
}

function findFirstAvailableCalendarDate({
  availabilityBlocks,
  calendarDays,
  endTime,
  startTime
}: {
  availabilityBlocks: CarerWorkspaceRecord["availabilityBlocks"];
  calendarDays: ReturnType<typeof getMonthDaysStartingMonday>["days"];
  endTime: string;
  startTime: string;
}) {
  const today = getTodayDateValue();

  return calendarDays.find((day) => {
    if (day.value < today) {
      return false;
    }

    return !findOverlappingAvailabilityBlock({
      availabilityBlocks,
      endsAt: `${day.value}T${endTime}`,
      startsAt: `${day.value}T${startTime}`
    });
  })?.value;
}

function formatBlockTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export function CarerCredentialForm({
  credential,
  formAction
}: {
  credential?: CarerWorkspaceRecord["credentials"][number];
  formAction: FormAction;
}) {
  return (
    <form action={formAction} className="compact-stack credential-form-card task-form-panel">
      {credential ? <input name="credentialId" type="hidden" value={credential.id} /> : null}
      <div className="task-form-heading">
        <span className="workspace-icon workspace-icon-credentials" aria-hidden="true" />
        <div>
          <strong>{credential ? "Update readiness evidence" : "Add readiness evidence"}</strong>
          <p>Credentials are matched against visit requirements</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="task-field-card">
          <span>What credential or skill is this?</span>
          <input
            defaultValue={credential?.name ?? ""}
            name="name"
            placeholder="NDIS Worker Screening"
            required
            type="text"
          />
        </label>
        <label className="task-field-card">
          <span>What is the review status?</span>
          <select defaultValue={credential?.status ?? "pending"} name="status">
            <option value="pending">Pending</option>
            <option value="valid">Valid</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="task-field-card">
          <span>When was it issued?</span>
          <input
            defaultValue={credential?.issuedAt?.slice(0, 10) ?? ""}
            name="issuedAt"
            type="date"
          />
        </label>
        <label className="task-field-card">
          <span>When does it expire?</span>
          <input
            defaultValue={credential?.expiresAt?.slice(0, 10) ?? ""}
            name="expiresAt"
            type="date"
          />
        </label>
        <label className="form-grid-span-2 task-field-card">
          <span>Where is the supporting document?</span>
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
