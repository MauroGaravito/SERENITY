import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";
import { createCareRecipient, createClientCenter } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  const workspace = await getAdminWorkspace(session.organizationId);
  const facilities = workspace.clients.flatMap((client) =>
    client.center.facilities.map((facility) => ({
      ...facility,
      centerName: client.center.displayName
    }))
  );

  return (
    <AdminShell
      currentSection="clients"
      title="Clients and sites"
      subtitle="Centros, sedes, contactos y pacientes antes de crear solicitudes."
    >
      <section className="ops-two-column admin-management-grid">
        <form action={createClientCenter} className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">New client</p>
              <h2>Add center and site</h2>
              <p className="panel-copy">
                Creates the client organization, first site and center manager access.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Center name</span>
              <input name="centerName" placeholder="Centro de Cuidado Niquia" required />
            </label>
            <label>
              <span>Site name</span>
              <input name="facilityName" placeholder="Sede Niquia" required />
            </label>
            <label className="form-grid-span-2">
              <span>Address</span>
              <input name="addressLine1" placeholder="Barrio Niquia" required />
            </label>
            <label>
              <span>Suburb</span>
              <input name="suburb" placeholder="Niquia" required />
            </label>
            <label>
              <span>State</span>
              <input name="state" placeholder="Antioquia" required />
            </label>
            <label>
              <span>Postal code</span>
              <input name="postalCode" placeholder="051051" />
            </label>
            <label>
              <span>Center contact</span>
              <input name="managerName" placeholder="Laura Garavito" required />
            </label>
            <label className="form-grid-span-2">
              <span>Contact email</span>
              <input name="managerEmail" placeholder="laura@serenity.local" required type="email" />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-link" type="submit">
              Create client
            </button>
          </div>
        </form>

        <form action={createCareRecipient} className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">New recipient</p>
              <h2>Add patient</h2>
              <p className="panel-copy">
                Adds the person who will later appear in the new service request flow.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-grid-span-2">
              <span>Site</span>
              <select name="facilityId" required>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.centerName} / {facility.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>First name</span>
              <input name="firstName" placeholder="Rosalba" required />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" placeholder="Garavito" />
            </label>
            <label>
              <span>External ref</span>
              <input name="externalRef" placeholder="NQ-0001" />
            </label>
            <label>
              <span>Notes</span>
              <input name="notes" placeholder="Care preferences or constraints" />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-link" disabled={facilities.length === 0} type="submit">
              Add patient
            </button>
          </div>
        </form>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Client network</p>
            <h2>{workspace.clients.length} centers linked to Serenity</h2>
            <p className="panel-copy">
              This is the hierarchy Mauricio needs before coordination: center, site, contact,
              and recipient.
            </p>
          </div>
        </div>

        <div className="admin-client-list">
          {workspace.clients.map((client) => (
            <article className="admin-client-card" key={client.id}>
              <div className="admin-client-head">
                <div>
                  <p className="card-tag">Client</p>
                  <h3>{client.center.displayName}</h3>
                  <p>{client.center.legalName}</p>
                </div>
                <span className="status-pill">{client.status}</span>
              </div>
              <div className="admin-client-body">
                {client.center.facilities.map((facility) => (
                  <div className="admin-site-card" key={facility.id}>
                    <strong>{facility.name}</strong>
                    <p>
                      {facility.suburb}, {facility.state}
                    </p>
                    <small>{facility.recipients.length} recipients</small>
                    <div className="admin-mini-list">
                      {facility.recipients.map((recipient) => (
                        <span key={recipient.id}>
                          {recipient.firstName} {recipient.lastName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="admin-site-card">
                  <strong>Center contacts</strong>
                  {client.center.users.map((user) => (
                    <p key={user.id}>
                      {user.fullName} / {user.email}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
