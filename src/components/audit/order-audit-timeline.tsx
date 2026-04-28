import { AuditEventRecord, formatDateTime, toTitleCase } from "@/lib/providers";

export function OrderAuditTimeline({ events }: { events: AuditEventRecord[] }) {
  return (
    <article className="ops-panel">
      <div className="panel-heading">
        <div>
          <p className="card-tag">Activity log</p>
          <h2>Order changes</h2>
        </div>
      </div>

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
    </article>
  );
}
