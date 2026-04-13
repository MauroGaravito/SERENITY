import Link from "next/link";
import { ReactNode } from "react";
import { SessionBanner } from "@/components/auth/session-banner";
import { getOptionalSession } from "@/lib/auth";

const navItems = [
  { href: "/providers", label: "Dashboard", key: "dashboard" },
  { href: "/providers/orders", label: "Orders", key: "orders" },
  { href: "/providers/closing", label: "Closing", key: "closing" }
] as const;

export async function ProviderShell({
  currentSection,
  title,
  subtitle,
  children
}: {
  currentSection: (typeof navItems)[number]["key"];
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <main className="providers-shell">
      <aside className="providers-sidebar">
        <Link className="providers-brand" href="/">
          Serenity
        </Link>
        <p className="providers-sidebar-copy">
          Operations core para prestadoras de homecare.
        </p>
        <nav className="providers-nav">
          {navItems.map((item) => (
            <Link
              className={`providers-nav-link ${currentSection === item.key ? "is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {session ? <SessionBanner session={session} /> : null}
      </aside>

      <section className="providers-main">
        <header className="providers-header">
          <div>
            <span className="eyebrow">Provider operations</span>
            <h1>{title}</h1>
          </div>
          <p>{subtitle}</p>
        </header>
        {children}
      </section>
    </main>
  );
}

