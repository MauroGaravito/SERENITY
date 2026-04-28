import Link from "next/link";
import { ReactNode } from "react";
import { SessionBanner } from "@/components/auth/session-banner";
import { type SessionUser } from "@/lib/auth";

export type AppShellNavItem<Key extends string = string> = {
  href: string;
  key: Key;
  label: string;
};

export function AppShell<Key extends string>({
  brand = "Serenity",
  children,
  currentSection,
  eyebrow,
  navItems,
  roleClassName,
  session,
  sidebarClassName,
  sidebarCopy,
  subtitle,
  title
}: {
  brand?: string;
  children: ReactNode;
  currentSection?: Key;
  eyebrow: string;
  navItems: readonly AppShellNavItem<Key>[];
  roleClassName?: string;
  session?: SessionUser | null;
  sidebarClassName?: string;
  sidebarCopy: string;
  subtitle: string;
  title: string;
}) {
  return (
    <main className={`app-shell ${roleClassName ?? ""}`}>
      <aside className={`app-sidebar ${sidebarClassName ?? ""}`}>
        <Link className="app-brand" href="/">
          {brand}
        </Link>
        <p className="app-sidebar-copy">{sidebarCopy}</p>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              className={`app-nav-link ${currentSection === item.key ? "is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {session ? <SessionBanner session={session} /> : null}
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <p>{subtitle}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
