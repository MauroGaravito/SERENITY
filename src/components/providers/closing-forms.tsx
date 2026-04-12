"use client";

import { useFormStatus } from "react-dom";
import {
  addVisitExpense,
  saveVisitSettlement,
  updateClosingPeriodStatus
} from "@/app/providers/actions";
import { ClosingPeriodRecord, ClosingVisitRecord } from "@/lib/providers";

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

export function ClosingPeriodStatusForm({
  period
}: {
  period: ClosingPeriodRecord;
}) {
  if (period.status === "exported") {
    return null;
  }

  const action = period.status === "open" ? "lock" : "export";
  const labels =
    action === "lock"
      ? { idle: "Lock period", pending: "Locking..." }
      : { idle: "Mark exported", pending: "Exporting..." };

  return (
    <form action={updateClosingPeriodStatus}>
      <input name="periodId" type="hidden" value={period.id} />
      <input name="statusAction" type="hidden" value={action} />
      <PendingButton idleLabel={labels.idle} pendingLabel={labels.pending} />
    </form>
  );
}

export function VisitSettlementForm({
  periodId,
  visit
}: {
  periodId: string;
  visit: ClosingVisitRecord;
}) {
  return (
    <form action={saveVisitSettlement} className="compact-stack credential-form-card">
      <input name="periodId" type="hidden" value={periodId} />
      <input name="visitId" type="hidden" value={visit.id} />
      <div className="form-grid">
        <label>
          <span>Approved minutes</span>
          <input
            defaultValue={visit.approvedMinutes ?? visit.suggestedApprovedMinutes}
            min={0}
            name="approvedMinutes"
            required
            type="number"
          />
        </label>
        <label>
          <span>Billable amount</span>
          <input
            defaultValue={
              typeof visit.billableCents === "number"
                ? (visit.billableCents / 100).toFixed(2)
                : ""
            }
            min={0}
            name="billableAmount"
            placeholder="165.00"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label>
          <span>Payable amount</span>
          <input
            defaultValue={
              typeof visit.payableCents === "number"
                ? (visit.payableCents / 100).toFixed(2)
                : ""
            }
            min={0}
            name="payableAmount"
            placeholder="104.00"
            required
            step="0.01"
            type="number"
          />
        </label>
      </div>
      <PendingButton idleLabel="Save settlement" pendingLabel="Saving..." />
    </form>
  );
}

export function VisitExpenseForm({
  periodId,
  visitId
}: {
  periodId: string;
  visitId: string;
}) {
  return (
    <form action={addVisitExpense} className="compact-stack credential-form-card">
      <input name="periodId" type="hidden" value={periodId} />
      <input name="visitId" type="hidden" value={visitId} />
      <div className="form-grid">
        <label>
          <span>Expense type</span>
          <select defaultValue="mileage" name="type">
            <option value="mileage">Mileage</option>
            <option value="travel">Travel</option>
            <option value="supplies">Supplies</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input min={0} name="amount" placeholder="18.00" required step="0.01" type="number" />
        </label>
        <label className="form-grid-span-2">
          <span>Note</span>
          <input name="note" placeholder="Local travel for approved visit" type="text" />
        </label>
        <label className="form-grid-span-2">
          <span>Evidence reference</span>
          <input
            name="evidenceUrl"
            placeholder="manual://expenses/mileage-receipt.jpg"
            type="text"
          />
        </label>
      </div>
      <PendingButton idleLabel="Add expense" pendingLabel="Adding..." />
    </form>
  );
}
