import { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { getOptionalSession } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Admin home", key: "overview" },
  { href: "/admin/clients", label: "Clients", key: "clients" },
  { href: "/admin/care-team", label: "Care team", key: "care-team" },
  { href: "/admin/workflows", label: "Workflows", key: "workflows" }
] as const;

export async function AdminShell({
  children,
  currentSection,
  subtitle,
  title
}: {
  children: ReactNode;
  currentSection: (typeof navItems)[number]["key"];
  subtitle: string;
  title: string;
}) {
  const session = await getOptionalSession();

  return (
    <AppShell
      currentSection={currentSection}
      eyebrow="Serenity admin"
      navItems={navItems}
      session={session}
      sidebarCopy="Configuracion de clientes, equipo y flujos antes de operar demanda."
      subtitle={subtitle}
      title={title}
    >
      {children}
    </AppShell>
  );
}
