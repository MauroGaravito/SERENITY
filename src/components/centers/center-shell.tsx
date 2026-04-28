import { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { getOptionalSession } from "@/lib/auth";

const navItems = [
  { href: "/centers", label: "Dashboard", key: "dashboard" },
  { href: "/centers/orders", label: "Orders", key: "orders" }
] as const;

export async function CenterShell({
  children,
  currentSection = "dashboard",
  subtitle,
  title
}: {
  children: ReactNode;
  currentSection?: (typeof navItems)[number]["key"];
  subtitle: string;
  title: string;
}) {
  const session = await getOptionalSession();

  return (
    <AppShell
      currentSection={currentSection}
      eyebrow="Center demand"
      navItems={navItems}
      roleClassName="app-shell-center centers-shell"
      session={session}
      sidebarClassName="app-sidebar-center centers-sidebar"
      sidebarCopy="Demand and compliance workspace for care centers."
      subtitle={subtitle}
      title={title}
    >
      {children}
    </AppShell>
  );
}
