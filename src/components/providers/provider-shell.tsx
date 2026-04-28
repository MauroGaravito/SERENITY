import { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { getOptionalSession } from "@/lib/auth";

const navItems = [
  { href: "/providers", label: "Dashboard", key: "dashboard" },
  { href: "/providers/orders", label: "Orders", key: "orders" },
  { href: "/providers/closing", label: "Closing", key: "closing" },
  { href: "/providers/export", label: "External export", key: "export" },
  { href: "/providers/audit", label: "Audit trail", key: "audit" }
] as const;

export async function ProviderShell({
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
      eyebrow="Provider operations"
      navItems={navItems}
      session={session}
      sidebarCopy="Operations core para prestadoras de homecare."
      subtitle={subtitle}
      title={title}
    >
      {children}
    </AppShell>
  );
}
