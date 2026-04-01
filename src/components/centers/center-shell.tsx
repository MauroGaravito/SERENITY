import Link from "next/link";
import { ReactNode } from "react";
import { SessionBanner } from "@/components/auth/session-banner";
import { getOptionalSession } from "@/lib/auth";

const navItems = [
  { href: "/centers", label: "Dashboard" },
  { href: "/centers/orders", label: "Orders" }
] as const;

export async function CenterShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <main className="providers-shell centers-shell">
      <aside className="providers-sidebar centers-sidebar">
        <Link className="providers-brand" href="/">
          Serenity
        </Link>
        <p className="providers-sidebar-copy">
          Demand and compliance workspace for care centers.
        </p>
        <nav className="providers-nav">
          {navItems.map((item) => (
            <Link className="providers-nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        {session ? <SessionBanner session={session} /> : null}
      </aside>

      <section className="providers-main">
        <header className="providers-header">
          <div>
            <span className="eyebrow">Center demand</span>
            <h1>{title}</h1>
          </div>
          <p>{subtitle}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
