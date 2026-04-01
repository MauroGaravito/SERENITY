import Link from "next/link";
import { SessionBanner } from "@/components/auth/session-banner";
import { getOptionalSession, getHomeForRole } from "@/lib/auth";
import { pillars, roles, site, workflow } from "@/lib/site";

export default async function HomePage() {
  const session = await getOptionalSession();

  return (
    <main className="page-shell">
      {session ? <SessionBanner session={session} /> : null}

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Product direction</span>
          <h1>{site.name} is the operating system for homecare networks.</h1>
          <p className="lede">
            Una sola plataforma para convertir demanda, cobertura, visitas,
            evidencia y cierre en una operacion verificable.
          </p>
          <div className="hero-actions">
            {session ? (
              <Link className="primary-link" href={getHomeForRole(session.role)}>
                Abrir mi workspace
              </Link>
            ) : (
              <Link className="primary-link" href="/login">
                Iniciar sesion
              </Link>
            )}
            <Link className="ghost-link" href="#workflow">
              Ver workflow
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <p className="panel-label">North star</p>
          <strong>Servicios completados y aprobados sin reproceso</strong>
          <ul>
            <li>Menos friccion entre centro, prestadora y cuidador</li>
            <li>Mas visibilidad operativa y mejor cierre</li>
            <li>Auditoria lista sin perseguir planillas ni PDFs</li>
          </ul>
        </div>
      </section>

      <section className="grid-section">
        {pillars.map((pillar) => (
          <article className="value-card" key={pillar.title}>
            <p className="card-tag">{pillar.title}</p>
            <p>{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="roles-section" id="roles">
        <div className="section-header">
          <span className="eyebrow">Three actors</span>
          <h2>Un mismo sistema, tres vistas operativas</h2>
        </div>
        <div className="roles-grid">
          {roles.map((role) => (
            <article className="role-card" key={role.slug}>
              <p className="card-tag">{role.name}</p>
              <h3>{role.accent}</h3>
              <ul>
                {role.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
              <Link className="inline-link" href={`/${role.slug}`}>
                Abrir vista conceptual
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-header">
          <span className="eyebrow">Core workflow</span>
          <h2>El sistema vive o muere por esta secuencia</h2>
        </div>
        <div className="workflow-strip">
          {workflow.map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

