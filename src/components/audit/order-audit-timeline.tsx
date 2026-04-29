import { AuditEventRecord, formatDateTime, toTitleCase } from "@/lib/providers";

export function OrderAuditTimeline({ events }: { events: AuditEventRecord[] }) {
  const latestEvent = events[0];

  return (
    <details className="ops-panel activity-log-panel">
      <summary>
        <span>
          <span className="card-tag">Activity log</span>
          <strong>Order changes</strong>
          <small>
            {latestEvent
              ? `Last update: ${toTitleCase(latestEvent.type)} / ${formatDateTime(latestEvent.createdAt)}`
              : "No workflow updates recorded yet"}
          </small>
        </span>
        <span className="skill-pill">{events.length} events</span>
      </summary>

      <div className="sequence-list audit-list">
        {events.length === 0 ? (
          <div className="note-block">
            <strong>No activity yet</strong>
            <p>The order has not recorded a workflow update yet.</p>
          </div>
        ) : (
          events.map((event) => (
            <div className="note-block" key={event.id}>
              <div className="order-row-meta">
                <strong>{toTitleCase(event.type)}</strong>
                <span className="skill-pill">{formatDateTime(event.createdAt)}</span>
              </div>
              <p>{event.summary}</p>
              {event.actorName ? (
                <p>
                  {event.actorName}
                  {event.actorRole ? ` · ${event.actorRole}` : ""}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </details>
  );
}
