import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";
import { createCareTeamMember, updateCarerCredentialStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminCareTeamPage() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  const workspace = await getAdminWorkspace(session.organizationId);

  return (
    <AdminShell
      currentSection="care-team"
      title="Care team"
      subtitle="Carers vinculados a Serenity, contacto, disponibilidad y credenciales."
    >
      <section className="ops-two-column admin-management-grid">
        <form action={createCareTeamMember} className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">New carer</p>
              <h2>Add care team member</h2>
              <p className="panel-copy">
                Carers belong to the provider. Today Serenity supports employee and independent
                carers; permanent/casual can be added as a later policy field.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>First name</span>
              <input name="firstName" placeholder="Gabriel" required />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" placeholder="Ramirez" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" placeholder="gabriel@serenity.local" required type="email" />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" placeholder="+57 300 000 0000" required />
            </label>
            <label>
              <span>Relationship</span>
              <select name="kind" defaultValue="INDEPENDENT">
                <option value="INDEPENDENT">Independent</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </label>
            <label>
              <span>Language</span>
              <input name="primaryLanguage" placeholder="Spanish" />
            </label>
            <label>
              <span>Business name</span>
              <input name="businessName" placeholder="Gabriel Ramirez Care Services" />
            </label>
            <label>
              <span>Tax id</span>
              <input name="taxId" placeholder="CC or NIT" />
            </label>
            <label className="form-grid-span-2">
              <span>Availability note</span>
              <input name="availabilityNote" placeholder="Available weekday mornings" />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-link" type="submit">
              Add carer
            </button>
          </div>
        </form>

        <section className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Care team summary</p>
              <h2>{workspace.stats.carers} carers</h2>
              <p className="panel-copy">
                Mauricio can see who belongs to Serenity and how to contact them before assignment.
              </p>
            </div>
          </div>
          <div className="metrics-grid metrics-grid-3">
            <article className="metric-card">
              <span>Active</span>
              <strong>{workspace.carers.filter((carer) => carer.isActive).length}</strong>
              <p>Available in matching.</p>
            </article>
            <article className="metric-card">
              <span>Employees</span>
              <strong>{workspace.carers.filter((carer) => carer.kind === "EMPLOYEE").length}</strong>
              <p>Internal team.</p>
            </article>
            <article className="metric-card">
              <span>Independents</span>
              <strong>
                {workspace.carers.filter((carer) => carer.kind === "INDEPENDENT").length}
              </strong>
              <p>External carers.</p>
            </article>
          </div>
          <div className="admin-readiness-grid compact-admin-readiness">
            <article className="admin-readiness-card needs-work">
              <span>Credential alerts</span>
              <strong>{workspace.stats.credentialAlerts}</strong>
              <p>Pending, expired or rejected credentials need admin attention.</p>
            </article>
            <article className="admin-readiness-card needs-work">
              <span>No availability</span>
              <strong>{workspace.stats.carersWithoutAvailability}</strong>
              <p>Carers without availability cannot support reliable matching.</p>
            </article>
            <article className="admin-readiness-card needs-work">
              <span>No credentials</span>
              <strong>{workspace.stats.carersWithoutCredentials}</strong>
              <p>New carers need credentials before they are operationally useful.</p>
            </article>
          </div>
        </section>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Roster pool</p>
            <h2>People Mauricio can coordinate</h2>
            <p className="panel-copy">
              This view answers whether carers work for Serenity: they are attached to the
              provider and can be contacted from the coordination workflow.
            </p>
          </div>
        </div>

        {workspace.carers.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No carers attached to Serenity</strong>
            <p>
              Add the first care team member before Mauricio starts assigning visits. Carers
              should have contact details, relationship type, availability and credentials.
            </p>
          </div>
        ) : (
          <div className="admin-care-list">
            {workspace.carers.map((carer) => {
            const invalidCredentials = carer.credentials.filter(
              (credential) => credential.status !== "VALID"
            );
            const missingAvailability = carer.availabilityBlocks.length === 0;
            const readyForMatching = invalidCredentials.length === 0 && !missingAvailability;
            const setupReasons = [
              invalidCredentials.length > 0
                ? `${invalidCredentials.length} credential alerts`
                : null,
              missingAvailability ? "No availability blocks" : null
            ].filter(Boolean);

            return (
              <details className="admin-carer-disclosure" key={carer.id}>
                <summary>
                  <div>
                    <strong>
                      {carer.firstName} {carer.lastName}
                    </strong>
                    <p>{carer.kind === "EMPLOYEE" ? "Employee" : "Independent"}</p>
                  </div>
                  <div className="admin-carer-summary-meta">
                    <span className={`status-pill ${readyForMatching ? "" : "status-warning"}`}>
                      {readyForMatching ? "Ready" : "Needs setup"}
                    </span>
                    <span>{carer.credentials.length} credentials</span>
                    <span>{invalidCredentials.length} alerts</span>
                    <span>{carer.availabilityBlocks.length} availability blocks</span>
                  </div>
                </summary>

                <div className="admin-carer-detail">
                  <div>
                    <p>{carer.availabilityNote ?? "No availability note yet."}</p>
                    {setupReasons.length > 0 ? (
                      <p className="admin-setup-reason">
                        Needs setup: {setupReasons.join(" / ")}.
                      </p>
                    ) : null}
                  </div>
                  <div className="admin-contact-grid">
                    <span>{carer.email ?? "No email"}</span>
                    <span>{carer.phone}</span>
                    <span>{carer.primaryLanguage ?? "No language set"}</span>
                  </div>
                </div>

                {invalidCredentials.length > 0 ? (
                  <div className="admin-credential-action-list">
                    {invalidCredentials.map((credential) => (
                      <form action={updateCarerCredentialStatus} className="admin-credential-action" key={credential.id}>
                        <input name="credentialId" type="hidden" value={credential.id} />
                        <div>
                          <strong>{credential.name}</strong>
                          <p>Current status: {credential.status.toLowerCase()}</p>
                        </div>
                        <label>
                          <span>Status</span>
                          <select defaultValue={credential.status} name="status">
                            <option value="PENDING">Pending</option>
                            <option value="VALID">Valid</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </label>
                        <label>
                          <span>Expires</span>
                          <input name="expiresAt" type="date" />
                        </label>
                        <button className="ghost-link" type="submit">
                          Save
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </details>
            );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
