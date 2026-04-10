import { redirectAuthenticatedUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

const demoAccounts = [
  {
    role: "Provider coordinator",
    email: "coordination@serenity.local"
  },
  {
    role: "Provider reviewer",
    email: "review@serenity.local"
  },
  {
    role: "Center manager",
    email: "harbour.manager@serenity.local"
  },
  {
    role: "Independent carer",
    email: "liam@serenity.local"
  }
] as const;

export default async function LoginPage() {
  await redirectAuthenticatedUser();
  const showDemoCredentials = process.env.SHOW_DEMO_CREDENTIALS === "true";

  return (
    <main className="auth-page-shell">
      <section className="auth-copy-card">
        <span className="eyebrow">Access control</span>
        <h1>Serenity sign in</h1>
        <p>
          Cada actor entra a una superficie distinta. La sesion ahora define que datos puede ver y que acciones puede ejecutar.
        </p>
        {showDemoCredentials ? (
          <>
            <div className="sequence-list auth-demo-list">
              {demoAccounts.map((account) => (
                <div className="note-block" key={account.email}>
                  <strong>{account.role}</strong>
                  <p>{account.email}</p>
                </div>
              ))}
            </div>
            <div className="note-block">
              <strong>Shared demo password</strong>
              <p>SerenityDemo!2026</p>
            </div>
          </>
        ) : (
          <div className="note-block">
            <strong>Restricted access</strong>
            <p>Demo credentials are intentionally hidden on public environments.</p>
          </div>
        )}
      </section>

      <section className="auth-panel-card">
        <div className="panel-heading auth-panel-heading">
          <div>
            <p className="card-tag">Session</p>
            <h2>Authenticate to continue</h2>
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}

