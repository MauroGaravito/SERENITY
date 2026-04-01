import { SessionBanner } from "@/components/auth/session-banner";
import { CARER_ROLES, requireOrganizationUser } from "@/lib/auth";

export default async function CarersPage() {
  const session = await requireOrganizationUser(CARER_ROLES);

  return (
    <main className="role-page carer-theme">
      <SessionBanner session={session} />

      <section>
        <span className="eyebrow">Cuidador independiente</span>
        <h1>Operacion movil con orden administrativo</h1>
        <p>
          Serenity debe ayudar al cuidador a ejecutar bien la visita y tambien a
          manejar su actividad como microempresa formal.
        </p>
      </section>

      <section className="role-columns">
        <article className="role-panel">
          <h2>Vista movil</h2>
          <ul>
            <li>Agenda del dia con estado de cada visita</li>
            <li>Checklist, evidencia e incidencias desde terreno</li>
            <li>Alertas por credenciales o documentos por vencer</li>
          </ul>
        </article>
        <article className="role-panel">
          <h2>Backoffice ligero</h2>
          <ul>
            <li>Historial de servicios e ingresos</li>
            <li>Gastos y kilometraje por visita</li>
            <li>Perfil profesional y disponibilidad</li>
          </ul>
        </article>
      </section>
    </main>
  );
}

